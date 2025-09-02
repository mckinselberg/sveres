// Lightweight sound manager using Web Audio API
// Generates simple percussive tones for collisions, scoring, and win/lose.

const Sound = (() => {
  let ctx = null;
  let enabled = true;
  let lastPlayAt = 0;
  let confirmedOnce = false;

  function ensureContext() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    return ctx;
  }

  function resumeOnGestureOnce() {
    const c = ensureContext();
    if (!c) return;
    if (c.state === 'running') return;
    const resume = () => {
      const p = c.resume && c.resume();
      const after = () => {
        // Tiny confirmation blip so users know sound is active
        if (!confirmedOnce) {
          try { blip({ freq: 660, dur: 0.07, type: 'sine', gain: 0.08 }); } catch {}
          confirmedOnce = true;
        }
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('mousedown', resume);
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
        window.removeEventListener('touchstart', resume, { passive: true });
      };
      if (p && typeof p.then === 'function') p.then(after).catch(after); else after();
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('mousedown', resume, { once: true });
    window.addEventListener('click', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true, passive: true });
  }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return !!enabled; }

  // Simple percussive note
  function blip({ freq = 440, dur = 0.08, type = 'sine', gain = 0.08, pan = 0 }) {
    if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  if (c.state !== 'running') { resumeOnGestureOnce(); return; }

    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    const p = c.createStereoPanner ? c.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
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
    if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  if (c.state !== 'running') { resumeOnGestureOnce(); return; }

    const bufferSize = 0.05 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

    src.connect(g);
    g.connect(c.destination);
    src.start();
    src.stop(c.currentTime + dur + 0.02);
  }

  function playCollision(intensity = 0.3) {
    // Throttle to avoid spam
    const nowMs = performance.now();
    if (nowMs - lastPlayAt < 12) return; // ~1 per frame max
    lastPlayAt = nowMs;

    const clamped = Math.max(0, Math.min(1, intensity));
  const base = 160 + clamped * 420; // higher freq for harder hits
  const gain = 0.07 + clamped * 0.09;
    blip({ freq: base, dur: 0.05 + clamped * 0.04, type: 'square', gain });
  if (clamped > 0.5) noiseHit({ dur: 0.04 + clamped * 0.04, gain: 0.04 + clamped * 0.08 });
  }

  function playWall(intensity = 0.25) {
    const clamped = Math.max(0, Math.min(1, intensity));
  blip({ freq: 220 + clamped * 180, dur: 0.05 + clamped * 0.03, type: 'triangle', gain: 0.08 + clamped * 0.06 });
  }

  function playScore() { blip({ freq: 720, dur: 0.07, type: 'sine', gain: 0.07 }); blip({ freq: 980, dur: 0.07, type: 'sine', gain: 0.06 }); }
  function playWin() { blip({ freq: 600, dur: 0.10, type: 'sine', gain: 0.07 }); blip({ freq: 800, dur: 0.14, type: 'sine', gain: 0.07 }); blip({ freq: 1000, dur: 0.18, type: 'sine', gain: 0.07 }); }
  function playLose() { blip({ freq: 220, dur: 0.16, type: 'sawtooth', gain: 0.08 }); blip({ freq: 160, dur: 0.20, type: 'sawtooth', gain: 0.07 }); }
  function playPowerup(type = 'shield') {
    if (type === 'speed') blip({ freq: 880, dur: 0.06, type: 'triangle', gain: 0.05 });
    else if (type === 'shrink') blip({ freq: 500, dur: 0.06, type: 'sine', gain: 0.05 });
    else if (type === 'expire') blip({ freq: 420, dur: 0.07, type: 'sine', gain: 0.055 });
    else blip({ freq: 760, dur: 0.06, type: 'sine', gain: 0.05 });
  }

  function init() { ensureContext(); resumeOnGestureOnce(); }

  return { init, setEnabled, isEnabled, playCollision, playWall, playScore, playWin, playLose, playPowerup };
})();

export default Sound;
