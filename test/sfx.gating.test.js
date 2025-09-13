import { describe, it, expect, beforeEach } from 'vitest';

// Minimal stub of Web Audio API to capture node creation and gain values
class FakeGainNode {
  constructor(ctx) {
    this.ctx = ctx;
    this.connections = [];
    const self = this;
    this.gain = {
      setValueAtTime(val /*, time */) {
        // capture initial set if it's the peak value; not strictly needed
        self.ctx._gainSetValues.push(val);
      },
      exponentialRampToValueAtTime(val /*, time */) {
        self.ctx._gainRampTargets.push(val);
        self.ctx._lastGainTarget = val;
      },
    };
  }
  connect(node) { this.connections.push(node); }
  disconnect() {}
}

class FakeOscNode {
  constructor(ctx) {
    this.ctx = ctx;
    this.type = 'sine';
    this.frequency = { value: 0, setValueAtTime(v) { this.value = v; } };
    this.connections = [];
  }
  connect(node) { this.connections.push(node); }
  start() {}
  stop() {}
}

class FakeStereoPannerNode {
  constructor() { this.pan = { value: 0 }; }
  connect() {}
}

class FakeBufferSource {
  constructor(ctx) { this.ctx = ctx; this.buffer = null; }
  connect() {}
  start() { this.ctx._noiseStarts++; }
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.destination = {};
    this._oscCount = 0;
    this._noiseStarts = 0;
    this._gainRampTargets = [];
    this._gainSetValues = [];
    this._lastGainTarget = undefined;
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createOscillator() { this._oscCount++; return new FakeOscNode(this); }
  createGain() { return new FakeGainNode(this); }
  createStereoPanner() { return new FakeStereoPannerNode(); }
  createBuffer(channels, length /*, rate */) { return { channels, length, getChannelData() { return new Float32Array(length); } }; }
  createBufferSource() { return new FakeBufferSource(this); }
}

describe('SFX gating (mute and volume)', () => {
  let Sound;
  let fakeCtx;

  beforeEach(async () => {
    // fresh module load each test so it picks up our stubbed AudioContext
    const g = globalThis;
    g.window = g.window || {};
    fakeCtx = new FakeAudioContext();
    // Provide a factory so the sound module can instantiate
    g.window.AudioContext = function StubbedAudioContext() { return fakeCtx; };
    g.window.webkitAudioContext = g.window.AudioContext;
    // Reset module cache and import
    const vitest = await import('vitest');
    vitest.vi.resetModules();
    ({ default: Sound } = await import('../src/utils/sound.js'));
    // Ensure engine enabled and context ready
    Sound.setEnabled(true);
  });

  it('does not create audio nodes when SFX is muted', () => {
    Sound.setSfxMuted(true);
    const beforeOsc = fakeCtx._oscCount;
    const beforeNoise = fakeCtx._noiseStarts;
    // playWall uses blip; playCollision may add noiseHit for high intensity
    Sound.playWall(0.3);
    Sound.playCollision(0.8);
    expect(fakeCtx._oscCount).toBe(beforeOsc);
    expect(fakeCtx._noiseStarts).toBe(beforeNoise);
  });

  it('scales SFX blip gain to zero when volume is 0', () => {
    Sound.setSfxMuted(false);
    Sound.setSfxVolume(0);
    // Deterministic: intensity 0 -> blip gain base 0.08 in playWall
    Sound.playWall(0);
    // First ramp target should be the peak gain (0 when volume=0)
    expect(fakeCtx._gainRampTargets[0]).toBe(0);
  });

  it('applies volume multiplier to SFX blip gain', () => {
    Sound.setSfxMuted(false);
    Sound.setSfxVolume(0.5);
    // intensity 0 -> base 0.08; expected target ~0.04
    Sound.playWall(0);
    const target = fakeCtx._gainRampTargets[0];
    expect(target).toBeGreaterThan(0);
    expect(Math.abs(target - 0.04)).toBeLessThan(0.005);
  });
});
