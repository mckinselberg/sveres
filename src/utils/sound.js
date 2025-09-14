// Lightweight sound manager using Web Audio API
// Generates simple percussive tones for collisions, scoring, and win/lose.

const Sound = (() => {
  const hasWindow = typeof window !== 'undefined';
  const nowMs = () =>
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
  let ctx = null;
  let enabled = true;
  let sfxMuted = false;
  let sfxVolume = 0.25; // 0..1 linear, applied as gain multiplier on SFX
  let lastPlayAt = 0;
  let confirmedOnce = false;

  // Global audio buses
  let bgmMasterGain = null; // all BGM tracks feed here
  let bgmLimiter = null; // gentle dynamics compressor to tame peaks
  let sfxSend = null; // SFX splitter (pre-fx)
  let sfxDryGain = null; // dry path gain
  let sfxFilter = null; // soft low-pass to mellow harshness
  let sfxWetGain = null; // reverb send (wet amount)
  let sfxConvolver = null; // simple IR reverb
  let sfxOutGain = null; // SFX master out

  // Background music tracks (multi-instance)
  // Track IDs are numeric; 0 is the default/back-compat track
  const bgmTracks = new Map();
  function getTrack(id = 0) {
    const key = Number(id) || 0;
    let t = bgmTracks.get(key);
    if (!t) {
      t = {
        id: key,
        playing: false,
        timerId: null,
        nextNoteTime: 0,
        tempo: 92,
        step: 0,
        gainNode: null,
        filterNode: null,
        wantAutostart: false,
        desiredVolume: 0.06,
        seed: key % 16, // small variation per track
      };
      bgmTracks.set(key, t);
    }
    return t;
  }

  function ensureContext() {
    if (!hasWindow) return null;
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    return ctx;
  }

  function ensureBgmBus() {
    const c = ensureContext();
    if (!c) return null;
    if (bgmMasterGain && bgmLimiter) return bgmMasterGain;
    try {
      bgmMasterGain = c.createGain();
      bgmMasterGain.gain.value = 1.0;
      bgmLimiter = c.createDynamicsCompressor();
      // Gentle, musical limiting to prevent peaks when volume is high
      bgmLimiter.threshold.setValueAtTime(-12, c.currentTime);
      bgmLimiter.knee.setValueAtTime(24, c.currentTime);
      bgmLimiter.ratio.setValueAtTime(4, c.currentTime);
      bgmLimiter.attack.setValueAtTime(0.005, c.currentTime);
      bgmLimiter.release.setValueAtTime(0.25, c.currentTime);
      bgmMasterGain.connect(bgmLimiter);
      bgmLimiter.connect(c.destination);
    } catch {
      // Fallback: connect master directly to destination if compressor fails
      if (bgmMasterGain) {
        try { bgmMasterGain.disconnect(); } catch {}
        try { bgmMasterGain.connect(c.destination); } catch {}
      }
    }
    return bgmMasterGain;
  }

  function createImpulse(c, duration = 1.1, decay = 2.5) {
    const rate = c.sampleRate;
    const len = Math.max(1, Math.floor(duration * rate));
    const impulse = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        // Exponential decay white noise
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return impulse;
  }

  function ensureSfxBus() {
    const c = ensureContext();
    if (!c) return null;
    if (sfxSend && sfxOutGain) return sfxSend;
    // Build SFX graph: source -> sfxSend -> [dry->LPF, wet->reverb] -> sfxOut -> destination
    sfxSend = c.createGain();
    sfxSend.gain.value = 1.0;

    sfxDryGain = c.createGain();
    sfxDryGain.gain.value = 1.0;
    sfxFilter = c.createBiquadFilter();
    sfxFilter.type = 'lowpass';
    sfxFilter.frequency.setValueAtTime(5500, c.currentTime); // soften highs
    sfxFilter.Q.setValueAtTime(0.7, c.currentTime);

    sfxWetGain = c.createGain();
    sfxWetGain.gain.value = 0.15; // subtle reverb by default
    sfxConvolver = c.createConvolver();
    try {
      sfxConvolver.normalize = true;
      sfxConvolver.buffer = createImpulse(c, 1.2, 3.0);
    } catch {}

    sfxOutGain = c.createGain();
    sfxOutGain.gain.value = 1.0;

    // Wiring
    sfxSend.connect(sfxDryGain);
    sfxDryGain.connect(sfxFilter);
    sfxFilter.connect(sfxOutGain);

    sfxSend.connect(sfxWetGain);
    sfxWetGain.connect(sfxConvolver);
    sfxConvolver.connect(sfxOutGain);

    sfxOutGain.connect(c.destination);
    return sfxSend;
  }

  function resumeOnGestureOnce() {
    if (!hasWindow) return;
    const c = ensureContext();
    if (!c) return;
    if (c.state === 'running') return;
    const resume = () => {
      const p = c.resume && c.resume();
      const after = () => {
        // Tiny confirmation blip so users know sound is active
        if (!confirmedOnce) {
          try {
            blip({ freq: 660, dur: 0.07, type: 'sine', gain: 0.08 });
          } catch {}
          confirmedOnce = true;
        }
        // Autostart any tracks that requested it
        try {
          bgmTracks.forEach((t) => {
            if (t && t.wantAutostart && !t.playing) {
              try { startBgm(t.id, { volume: t.desiredVolume }); } catch {}
            }
            if (t) t.wantAutostart = false;
          });
        } catch {}
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('mousedown', resume);
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
        window.removeEventListener('touchstart', resume, { passive: true });
      };
      if (p && typeof p.then === 'function') p.then(after).catch(after);
      else after();
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('mousedown', resume, { once: true });
    window.addEventListener('click', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true, passive: true });
  }

  function setEnabled(v) {
    enabled = !!v;
  }
  function setSfxMuted(v) { sfxMuted = !!v; }
  function setSfxVolume(v) { sfxVolume = Math.max(0, Math.min(1, Number(v))); }
  function getSfxMuted() { return !!sfxMuted; }
  function getSfxVolume() { return sfxVolume; }
  function isEnabled() {
    return !!enabled;
  }

  // Simple percussive note
  function blip({ freq = 440, dur = 0.08, type = 'sine', gain = 0.08, pan = 0 }) {
    if (!enabled || sfxMuted) return;
    const c = ensureContext();
    if (!c) return;
    if (c.state !== 'running') {
      resumeOnGestureOnce();
      return;
    }

    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    const p = c.createStereoPanner ? c.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
  const finalGain = Math.max(0, gain * sfxVolume);
  g.gain.exponentialRampToValueAtTime(finalGain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    if (p) {
      p.pan.value = pan;
      osc.connect(g);
      g.connect(p);
      const dest = ensureSfxBus();
      if (dest) p.connect(dest); else p.connect(c.destination);
    } else {
      osc.connect(g);
      const dest = ensureSfxBus();
      if (dest) g.connect(dest); else g.connect(c.destination);
    }

    osc.start(now);
    osc.stop(now + Math.max(0.03, dur + 0.02));
  }

  // White noise hit for rough impacts
  function noiseHit({ dur = 0.05, gain = 0.06 }) {
    if (!enabled || sfxMuted) return;
    const c = ensureContext();
    if (!c) return;
    if (c.state !== 'running') {
      resumeOnGestureOnce();
      return;
    }

    const bufferSize = 0.05 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
  g.gain.setValueAtTime(Math.max(0, gain * sfxVolume), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

    src.connect(g);
    {
      const dest = ensureSfxBus();
      if (dest) g.connect(dest); else g.connect(c.destination);
    }
    src.start();
    src.stop(c.currentTime + dur + 0.02);
  }

  function playCollision(intensity = 0.3) {
    // Throttle to avoid spam
    const t = nowMs();
    if (t - lastPlayAt < 12) return; // ~1 per frame max
    lastPlayAt = t;

    const clamped = Math.max(0, Math.min(1, intensity));
    const base = 160 + clamped * 420; // higher freq for harder hits
    const gain = 0.07 + clamped * 0.09;
    blip({ freq: base, dur: 0.05 + clamped * 0.04, type: 'square', gain });
    if (clamped > 0.5)
      noiseHit({ dur: 0.04 + clamped * 0.04, gain: 0.04 + clamped * 0.08 });
  }

  function playWall(intensity = 0.25) {
    const clamped = Math.max(0, Math.min(1, intensity));
    blip({
      freq: 220 + clamped * 180,
      dur: 0.05 + clamped * 0.03,
      type: 'triangle',
      gain: 0.08 + clamped * 0.06,
    });
  }

  function playScore() {
    blip({ freq: 720, dur: 0.07, type: 'sine', gain: 0.07 });
    blip({ freq: 980, dur: 0.07, type: 'sine', gain: 0.06 });
  }
  function playWin() {
    blip({ freq: 600, dur: 0.1, type: 'sine', gain: 0.07 });
    blip({ freq: 800, dur: 0.14, type: 'sine', gain: 0.07 });
    blip({ freq: 1000, dur: 0.18, type: 'sine', gain: 0.07 });
  }
  function playLose() {
    blip({ freq: 220, dur: 0.16, type: 'sawtooth', gain: 0.08 });
    blip({ freq: 160, dur: 0.2, type: 'sawtooth', gain: 0.07 });
  }
  function playPowerup(type = 'shield') {
    if (type === 'speed')
      blip({ freq: 880, dur: 0.06, type: 'triangle', gain: 0.05 });
    else if (type === 'shrink')
      blip({ freq: 500, dur: 0.06, type: 'sine', gain: 0.05 });
    else if (type === 'health')
      blip({ freq: 640, dur: 0.09, type: 'sine', gain: 0.06 });
    else if (type === 'expire')
      blip({ freq: 420, dur: 0.07, type: 'sine', gain: 0.055 });
    else blip({ freq: 760, dur: 0.06, type: 'sine', gain: 0.05 });
  }
  function playPop() {
    blip({ freq: 520, dur: 0.07, type: 'square', gain: 0.08 });
  }

  function init() {
    ensureContext();
    resumeOnGestureOnce();
  }

  // --- Background music (simple generative loop) ---
  function scheduleBgmNoteAt(track, time, freq, dur = 0.24, gain = 0.025) {
    const c = ctx;
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    // route through filter then bgm gain -> bgm master -> limiter -> destination
    if (track.filterNode) {
      g.connect(track.filterNode);
    } else if (track.gainNode) {
      g.connect(track.gainNode);
    } else {
      const master = ensureBgmBus();
      if (master) g.connect(master); else g.connect(c.destination);
    }
    osc.start(time);
    osc.stop(time + Math.max(0.05, dur + 0.02));
  }

  // E minor pentatonic base in a calm range
  const PENTA = [329.63, 392.0, 440.0, 493.88, 587.33]; // E4,G4,A4,B4,D5
  function bgmFreqForStep(step) {
    const barPos = step % 16;
    const idx =
      [0, 2, 1, 3, 0, 2, 4, 3, 0, 1, 2, 3, 0, 2, 1, 3][barPos] || 0;
    const base = PENTA[idx];
    // Subtle octave drop on downbeats
    const octave = barPos === 0 || barPos === 8 ? 0.5 : 1;
    return base * octave;
  }

  function startBgm(idOrOptions, maybeOptions) {
    // Back-compat: startBgm(options)
    let id = 0;
    let options = {};
    if (typeof idOrOptions === 'object' && idOrOptions !== null) {
      options = idOrOptions;
    } else {
      id = Number(idOrOptions) || 0;
      options = maybeOptions || {};
    }
    if (!enabled) return false;
    const c = ensureContext();
    if (!c) {
      return false;
    }
    const track = getTrack(id);
    if (track.playing) return true;
    if (c.state !== 'running') {
      // Defer until user gesture resumes audio; set a one-off autostart flag
      track.wantAutostart = true;
      resumeOnGestureOnce();
      return false;
    }
    track.wantAutostart = false;
    // Create a bgm master gain and soft LPF for warmth
    track.gainNode = c.createGain();
    const vol = Math.max(
      0.0,
      Math.min(1.0, options.volume ?? track.desiredVolume ?? 0.06)
    );
    track.desiredVolume = vol;
    track.gainNode.gain.value = vol;
    try {
      track.filterNode = c.createBiquadFilter();
      track.filterNode.type = 'lowpass';
      track.filterNode.frequency.setValueAtTime(1600, c.currentTime);
      track.filterNode.Q.value = 0.3;
      track.filterNode.connect(track.gainNode);
    } catch {
      track.filterNode = null;
    }
  const master = ensureBgmBus();
  if (master) track.gainNode.connect(master);
  else track.gainNode.connect(c.destination);
    track.tempo = Math.max(60, Math.min(140, options.tempo ?? track.tempo));
    track.step = track.seed || 0;
    track.nextNoteTime = c.currentTime + 0.05;
  const secondsPerBeat = 60.0 / track.tempo; // quarter
    const scheduleAheadTime = 0.12;
    const lookaheadMs = 25;
    track.playing = true;
    track.timerId = window.setInterval(() => {
      // Schedule notes slightly ahead
      while (c.currentTime + scheduleAheadTime >= track.nextNoteTime) {
        const freq = bgmFreqForStep(track.step);
        // light syncopation: every other step longer
        const dur = track.step % 2 === 0 ? 0.26 : 0.18;
        scheduleBgmNoteAt(
          track,
          track.nextNoteTime,
          freq,
          dur,
          options.noteGain ?? 0.025
        );
        track.nextNoteTime += secondsPerBeat / 2; // 8th notes
        track.step = (track.step + 1) % 64;
      }
    }, lookaheadMs);
    return true;
  }

  function stopBgm(id = 0) {
    const track = getTrack(id);
    track.wantAutostart = false;
    if (track.timerId != null) {
      try {
        clearInterval(track.timerId);
      } catch {}
      track.timerId = null;
    }
    try {
      if (track.filterNode) track.filterNode.disconnect();
    } catch {}
    try {
      if (track.gainNode) track.gainNode.disconnect();
    } catch {}
    track.filterNode = null;
    track.gainNode = null;
    track.playing = false;
  }

  function stopAllBgm() {
    try {
      bgmTracks.forEach((t) => {
        try { stopBgm(t.id); } catch {}
      });
    } catch {}
  }

  function isBgmPlaying(id = 0) {
    const track = getTrack(id);
    return !!track.playing;
  }

  function setBgmVolume(idOrVolume, maybeVolume) {
    // Back-compat: setBgmVolume(volume) -> track 0
    let id = 0;
    let volume = 0;
    if (typeof idOrVolume === 'number' && typeof maybeVolume === 'number') {
      id = Number(idOrVolume) || 0;
      volume = maybeVolume;
    } else {
      volume = Number(idOrVolume);
    }
  const vol = Math.max(0, Math.min(1.0, Number(volume)));
    const track = getTrack(id);
    track.desiredVolume = vol;
    if (track.gainNode) {
      try {
        track.gainNode.gain.value = vol;
      } catch {}
    }
  }

  function getBgmTracks() {
    return Array.from(bgmTracks.values()).map(t => ({ id: t.id, playing: !!t.playing, volume: t.desiredVolume }));
  }

  // HMR safety: stop any running intervals/nodes on module dispose to prevent duplicates
  try {
    if (typeof import.meta !== 'undefined' && import.meta.hot && typeof window !== 'undefined') {
      import.meta.hot.dispose(() => {
        try { stopAllBgm(); } catch {}
      });
    }
  } catch {}

  return {
    init,
    setEnabled,
    setSfxMuted,
    setSfxVolume,
    getSfxMuted,
    getSfxVolume,
    isEnabled,
    playCollision,
    playWall,
    playScore,
    playWin,
    playLose,
    playPowerup,
    playPop,
    startBgm,
    stopBgm,
    stopAllBgm,
    isBgmPlaying,
    setBgmVolume,
    getBgmTracks,
  };
})();

export default Sound;
