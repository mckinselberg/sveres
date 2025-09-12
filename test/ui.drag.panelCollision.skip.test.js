/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { Ball } from '../src/utils/Ball.ts';
import { beginUiDrag, endUiDrag } from '../src/utils/dom.js';

function addControlsPanelRect(rect = { left: 0, top: 0, right: 300, bottom: 300 }) {
  const el = document.createElement('div');
  el.className = 'controls-panel';
  el.getBoundingClientRect = () => ({
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON() { return this; }
  });
  document.body.appendChild(el);
  return el;
}

describe('UI drag flag skips panel-collision work', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Ensure at least one canvas exists for any focus behaviors (not required but safe)
    const cnv = document.createElement('canvas');
    document.body.appendChild(cnv);
  });

  it('applies panel-collision when not dragging', () => {
    addControlsPanelRect({ left: 0, top: 0, right: 300, bottom: 300 });
    const b = new Ball(50, 50, 0, 0, 'red', 20, 'circle', false);
    // Spy on deformation call
    let called = 0;
    const orig = b.applyWallDeformation.bind(b);
    b.applyWallDeformation = (...args) => { called++; return orig(...args); };

    // Update with neutral physics
    b.update(1000, 1000, 0, 10, { enabled: true, intensity: 1, speed: 0.05, ease: 'power2.out' });

    expect(called).toBeGreaterThan(0);
    // Should have been nudged out from inside the panel rect
    expect(b.x).not.toBe(50);
    expect(b.y).toBe(50); // With normalX=1, normalY=0 fallback, only x shifts in our start pose
  });

  it('skips panel-collision while dragging', () => {
    addControlsPanelRect({ left: 0, top: 0, right: 300, bottom: 300 });
    const b = new Ball(50, 50, 0, 0, 'red', 20, 'circle', false);
    let called = 0;
    b.applyWallDeformation = () => { called++; };

    beginUiDrag();
    try {
      b.update(1000, 1000, 0, 10, { enabled: true, intensity: 1, speed: 0.05, ease: 'power2.out' });
    } finally {
      endUiDrag();
    }

    expect(called).toBe(0);
    // No gravity/velocity; without panel-collision, position should remain unchanged
    expect(b.x).toBe(50);
    expect(b.y).toBe(50);
  });
});
