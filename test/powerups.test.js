import { describe, it, expect, beforeEach } from 'vitest';
import { resolvePowerups, applyPowerupPickups } from '../src/utils/powerups.js';

const mkLevel = (powerups) => ({ powerups: powerups.map(p => ({ shape: 'circle', radius: 10, ...p })) });

describe('powerups', () => {
  const W = 800, H = 600;
  let balls;

  beforeEach(() => {
    balls = [{ id: 1, x: 100, y: 100, size: 10, isStartingBall: true }];
  });

  it('resolves positions based on level config', () => {
  const level = mkLevel([{ x: 'center', y: 'bottom-20', type: 'shield' }]);
    const r = resolvePowerups(level, W, H);
    expect(r[0].x).toBeCloseTo(W / 2);
  // bottom-20 is measured from bottom edge to the object's outer edge; circle radius=10 -> y = H - 10 - 20
  expect(r[0].y).toBeCloseTo(H - 10 - 20);
  });

  it('applies shield and removes pickup on overlap', () => {
    const level = mkLevel([{ x: 100, y: 100, type: 'shield' }]);
    const resolved = resolvePowerups(level, W, H);
    applyPowerupPickups(level, balls, resolved, { id: 1 });
    expect(level.powerups.length).toBe(0);
    expect(balls[0].shieldUntil).toBeGreaterThan(Date.now());
  });

  it('applies shrink size and duration', () => {
    const level = mkLevel([{ x: 100, y: 100, type: 'shrink' }]);
    const resolved = resolvePowerups(level, W, H);
    balls[0].size = 30;
    applyPowerupPickups(level, balls, resolved, { id: 1 });
    expect(balls[0].size).toBeLessThan(30);
    expect(balls[0].shrinkUntil).toBeGreaterThan(Date.now());
  });
});
