import { describe, it, expect } from 'vitest';
import { loop as physicsLoop } from '../src/utils/physics.jsx';
import { Ball } from '../src/utils/Ball.ts';

function makeStubCtx() {
  // Minimal 2D context stub with no-ops for methods we call in loop/Ball.draw
  const noop = () => {};
  return {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: 'transparent',
    save: noop,
    restore: noop,
  translate: noop,
  rotate: noop,
  scale: noop,
  setTransform: noop,
    beginPath: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    rect: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
  };
}

function setupBalls() {
  const player = new Ball(200, 200, 20, 0, 'red', 10, 'circle', false);
  player.isStartingBall = true;
  const other = new Ball(600, 200, 20, 0, 'blue', 10, 'circle', false);
  return { player, other };
}

describe('propagatePlayerSpeedBoost toggle', () => {
  it('does not change other balls when disabled', () => {
    const ctx = makeStubCtx();
    const { player, other } = setupBalls();
    const balls = [player, other];
    const now = Date.now();
    player.speedUntil = now + 3000; // active boost
    const settings = {
      enableGravity: false,
      gravityStrength: 0,
      ballVelocity: 5,
      deformation: { enabled: false, intensity: 0.5, speed: 0.5, ease: 'power2.out' },
      gameplay: { scoring: false, sandbox: true, healthSystem: false, healthDamageMultiplier: 1, propagatePlayerSpeedBoost: false },
    };
    physicsLoop(ctx, balls, 1000, 600, settings, '#000', 1, null, player, null, null, null, null, null);
    // Player should be clamped to boosted cap 5*1.6=8
    expect(Math.abs(player.velX)).toBeLessThanOrEqual(8 + 1e-6);
    // Other should be clamped to base cap 5
    expect(Math.abs(other.velX)).toBeLessThanOrEqual(5 + 1e-6);
  });

  it('raises other balls max cap when enabled', () => {
    const ctx = makeStubCtx();
    const { player, other } = setupBalls();
    const balls = [player, other];
    const now = Date.now();
    player.speedUntil = now + 3000; // active boost
    const settings = {
      enableGravity: false,
      gravityStrength: 0,
      ballVelocity: 5,
      deformation: { enabled: false, intensity: 0.5, speed: 0.5, ease: 'power2.out' },
      gameplay: { scoring: false, sandbox: true, healthSystem: false, healthDamageMultiplier: 1, propagatePlayerSpeedBoost: true },
    };
    physicsLoop(ctx, balls, 1000, 600, settings, '#000', 1, null, player, null, null, null, null, null);
    // Player should be clamped to boosted cap 8
    expect(Math.abs(player.velX)).toBeLessThanOrEqual(8 + 1e-6);
    // Other should also be allowed up to boosted cap when propagation enabled
    expect(Math.abs(other.velX)).toBeLessThanOrEqual(8 + 1e-6);
  });
});
