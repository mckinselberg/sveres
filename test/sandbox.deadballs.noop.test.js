/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { loop, initializeBalls } from '../src/utils/physics.jsx';

// Create a minimal fake canvas context
function makeCtx(w = 800, h = 600) {
  const calls = [];
  return {
    canvas: { width: w, height: h },
    fillStyle: '#000',
    fillRect: (x,y,ww,hh) => calls.push(['fillRect', x,y,ww,hh]),
    beginPath: () => calls.push(['beginPath']),
    arc: () => calls.push(['arc']),
    rect: () => calls.push(['rect']),
    moveTo: () => calls.push(['moveTo']),
    lineTo: () => calls.push(['lineTo']),
    closePath: () => calls.push(['closePath']),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    translate: () => calls.push(['translate']),
    rotate: () => calls.push(['rotate']),
    scale: () => calls.push(['scale']),
    set globalAlpha(v) { calls.push(['ga', v]); },
    get globalAlpha() { return 1; },
  };
}

describe('Sandbox: dead balls remain when pop/despawn disabled', () => {
  it('leaves health<=0 balls on canvas when toggle is off', () => {
    // Ensure DOM globals used by getControlsPanel exist
    Object.defineProperty(window, 'innerWidth', { value: 640, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 480, configurable: true });
    if (!document.querySelector('.controls-panel')) {
      const el = document.createElement('div');
      el.className = 'controls-panel';
      document.body.appendChild(el);
    }
    const ctx = makeCtx(640, 480);
    const balls = [];
    initializeBalls(balls, 3, 20, 5, 640, 480, 'circle');
    // Force one ball to dead state
    balls[1].health = 0;
    balls[1].isDespawning = false;

    const physicsSettings = {
      enableGravity: false,
      gravityStrength: 0,
      ballVelocity: 5,
      deformation: { enabled: false, intensity: 1, speed: 0.05, ease: 'power2.out' },
      gameplay: { healthSystem: true, healthDamageMultiplier: 0.1, popDespawnEnabled: false },
    };

    const beforeCount = balls.length;
    loop(ctx, balls, 640, 480, physicsSettings, '#000', 1, null, null, /*level*/ null, null, null, null);
    const afterCount = balls.length;
    // Should not remove dead ball when toggle off
    expect(afterCount).toBe(beforeCount);
  });
});
