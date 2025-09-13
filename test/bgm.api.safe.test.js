/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import Sound from '../src/utils/sound.js';

describe('Sound BGM API (jsdom-safe)', () => {
  it('exposes bgm controls and does not throw in jsdom', () => {
    expect(typeof Sound.startBgm).toBe('function');
    expect(typeof Sound.stopBgm).toBe('function');
    expect(typeof Sound.isBgmPlaying).toBe('function');
    // jsdom has no AudioContext; calls should be no-ops and not throw
    const started = Sound.startBgm({ tempo: 100, volume: 0.02 });
    expect(started === true || started === false).toBe(true);
    expect(Sound.isBgmPlaying()).toBe(false);
    Sound.stopBgm();
  });
});
