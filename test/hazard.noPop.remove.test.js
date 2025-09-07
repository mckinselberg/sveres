/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loop } from '../src/utils/physics.jsx';
import { Ball } from '../src/utils/Ball.ts';

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

describe('Hazard damage: removes dead ball without pop when toggle is off', () => {
  let originalPop;
  let popCalls = 0;
  beforeEach(() => {
    if (!document.querySelector('.controls-panel')) {
      const el = document.createElement('div');
      el.className = 'controls-panel';
      document.body.appendChild(el);
    }
    originalPop = Ball.prototype.popAndDespawn;
    Ball.prototype.popAndDespawn = function(onComplete) { popCalls++; onComplete && onComplete(); };
    popCalls = 0;
  });
  afterEach(() => { Ball.prototype.popAndDespawn = originalPop; popCalls = 0; });

  it('kills and removes the ball immediately on hazard collision when popDespawnEnabled=false', () => {
    const ctx = makeCtx(640, 480);
    const balls = [];
    // Place ball overlapping a hazard so it takes damage to zero
    const b = new Ball(320, 240, 0, 0, 'red', 12, 'circle', false);
    b.health = 1; // ensure one hit kills
    balls.push(b);

    const level = {
      type: 'custom',
      hazards: [ { shape: 'circle', x: 320, y: 240, radius: 20, color: 'red' } ],
      goals: []
    };
    const physicsSettings = {
      enableGravity: false,
      gravityStrength: 0,
      ballVelocity: 5,
      deformation: { enabled: false, intensity: 1, speed: 0.05, ease: 'power2.out' },
      gameplay: { popDespawnEnabled: false, healthSystem: true, healthDamageMultiplier: 10 }
    };

    expect(balls.length).toBe(1);
    loop(ctx, balls, 640, 480, physicsSettings, '#000', 1, null, null, level, null, null, null);
    expect(balls.length).toBe(0);
    expect(popCalls).toBe(0);
  });
});
