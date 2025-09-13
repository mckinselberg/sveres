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

  // Background music state
  const bgm = {
    playing: false,
    timerId: null,
    nextNoteTime: 0,
    tempo: 92,
    step: 0,
    gainNode: null,
    filterNode: null,
    wantAutostart: false,
    desiredVolume: 0.06,
  };

  function ensureContext() {
    if (!hasWindow) return null;
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    return ctx;
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
        // Autostart bgm if requested
        if (bgm.wantAutostart && !bgm.playing) {
          try {
            startBgm();
          } catch {}
        }
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
      p.connect(c.destination);
    } else {
      osc.connect(g);
      g.connect(c.destination);
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
    g.connect(c.destination);
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
  function scheduleBgmNoteAt(time, freq, dur = 0.24, gain = 0.025) {
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
    // route through filter then bgm gain -> destination
    if (bgm.filterNode) {
      g.connect(bgm.filterNode);
    } else if (bgm.gainNode) {
      g.connect(bgm.gainNode);
    } else {
      g.connect(c.destination);
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

  function startBgm(options = {}) {
    if (!enabled) return false;
    const c = ensureContext();
    if (!c) {
      return false;
    }
    if (bgm.playing) return true;
    if (c.state !== 'running') {
      // Defer until user gesture resumes audio; set a one-off autostart flag
      bgm.wantAutostart = true;
      resumeOnGestureOnce();
      return false;
    }
    bgm.wantAutostart = false;
    // Create a bgm master gain and soft LPF for warmth
    bgm.gainNode = c.createGain();
    const vol = Math.max(
      0.0,
      Math.min(0.5, options.volume ?? bgm.desiredVolume ?? 0.06)
    );
    bgm.desiredVolume = vol;
    bgm.gainNode.gain.value = vol;
    try {
      bgm.filterNode = c.createBiquadFilter();
      bgm.filterNode.type = 'lowpass';
      bgm.filterNode.frequency.setValueAtTime(1600, c.currentTime);
      bgm.filterNode.Q.value = 0.3;
      bgm.filterNode.connect(bgm.gainNode);
    } catch {
      bgm.filterNode = null;
    }
    bgm.gainNode.connect(c.destination);
    bgm.tempo = Math.max(60, Math.min(140, options.tempo ?? bgm.tempo));
    bgm.step = 0;
    bgm.nextNoteTime = c.currentTime + 0.05;
    const secondsPerBeat = 60.0 / bgm.tempo; // quarter
    const scheduleAheadTime = 0.12;
    const lookaheadMs = 25;
    bgm.playing = true;
    bgm.timerId = window.setInterval(() => {
      // Schedule notes slightly ahead
      while (c.currentTime + scheduleAheadTime >= bgm.nextNoteTime) {
        const freq = bgmFreqForStep(bgm.step);
        // light syncopation: every other step longer
        const dur = bgm.step % 2 === 0 ? 0.26 : 0.18;
        scheduleBgmNoteAt(
          bgm.nextNoteTime,
          freq,
          dur,
          options.noteGain ?? 0.025
        );
        bgm.nextNoteTime += secondsPerBeat / 2; // 8th notes
        bgm.step = (bgm.step + 1) % 64;
      }
    }, lookaheadMs);
    return true;
  }

  function stopBgm() {
    bgm.wantAutostart = false;
    if (bgm.timerId != null) {
      try {
        clearInterval(bgm.timerId);
      } catch {}
      bgm.timerId = null;
    }
    try {
      if (bgm.filterNode) bgm.filterNode.disconnect();
    } catch {}
    try {
      if (bgm.gainNode) bgm.gainNode.disconnect();
    } catch {}
    bgm.filterNode = null;
    bgm.gainNode = null;
    bgm.playing = false;
  }

  function isBgmPlaying() {
    return !!bgm.playing;
  }

  function setBgmVolume(volume) {
    const vol = Math.max(0, Math.min(0.5, Number(volume)));
    bgm.desiredVolume = vol;
    if (bgm.gainNode) {
      try {
        bgm.gainNode.gain.value = vol;
      } catch {}
    }
  }

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
    isBgmPlaying,
    setBgmVolume,
  };
})();

export default Sound;
