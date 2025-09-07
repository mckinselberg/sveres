/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loop } from '../src/utils/physics.jsx';
import { Ball } from '../src/utils/Ball.ts';

// Minimal canvas 2D context stub
function makeCtx(w = 800, h = 600) {
  return {
    canvas: { width: w, height: h },
    fillStyle: '#000',
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    rect: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    set globalAlpha(v) {},
    get globalAlpha() { return 1; },
  };
}

describe('Goal scoring: removes ball without pop when toggle is off', () => {
  let originalPop;
  let popCalls = 0;
  beforeEach(() => {
    // Ensure controls panel exists to satisfy Ball.update DOM query
    if (!document.querySelector('.controls-panel')) {
      const el = document.createElement('div');
      el.className = 'controls-panel';
      document.body.appendChild(el);
    }
    // Spy on pop
    originalPop = Ball.prototype.popAndDespawn;
    Ball.prototype.popAndDespawn = function(onComplete) { popCalls++; onComplete && onComplete(); };
    popCalls = 0;
  });
  afterEach(() => { Ball.prototype.popAndDespawn = originalPop; popCalls = 0; });

  it('removes the non-player ball on goal overlap without calling pop when popDespawnEnabled=false', () => {
    const ctx = makeCtx(640, 480);
    const balls = [];
    const b = new Ball(320, 240, 0, 0, 'red', 12, 'circle', false);
    b.isStartingBall = false; // ensure treated as non-player
    balls.push(b);

    const level = {
      type: 'custom',
      goals: [ { shape: 'circle', x: 320, y: 240, radius: 20, color: 'green' } ],
      hazards: []
    };
    const physicsSettings = {
      enableGravity: false,
      gravityStrength: 0,
      ballVelocity: 5,
      deformation: { enabled: false, intensity: 1, speed: 0.05, ease: 'power2.out' },
      gameplay: { popDespawnEnabled: false, healthSystem: false, healthDamageMultiplier: 0.1 }
    };

    expect(balls.length).toBe(1);
    loop(ctx, balls, 640, 480, physicsSettings, '#000', 1, null, null, level, null, null, null);
    // Ball should be removed; no pop should occur
    expect(balls.length).toBe(0);
    expect(popCalls).toBe(0);
  });
});
