/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Canvas from '../src/components/Canvas.jsx';

function mount(baseProps) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(Canvas, baseProps));
  });
  return { root, container };
}

describe('shape apply-to-existing gating', () => {
  it('does not change existing ball shapes when checkbox is off, but does when on', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });

    const ref = createRef();
    let lastSnapshot = [];
    const onBallsSnapshot = (arr) => { lastSnapshot = arr; };
    const common = {
      ref,
      enableGravity: true,
      gravityStrength: 0.15,
      ballVelocity: 5,
      deformation: { enabled: true, intensity: 0.5, speed: 0.05, ease: 'power2.out', easeOverride: '' },
      gameplay: { scoring: false, sandbox: true, healthSystem: false, healthDamageMultiplier: 0.2 },
      backgroundColor: '#000000',
      trailOpacity: 0.2,
      setGlobalScore: () => {},
      _selectedBall: null,
      onSelectedBallChange: () => {},
      onBallsSnapshot,
      isPaused: true,
      level: { type: 'sandboxLevel', hazards: [], goals: [] },
      setScoredBallsCount: () => {},
      setRemovedBallsCount: () => {},
      ballCount: 5,
      ballSize: 12,
      newBallSize: 12,
      onWin: () => {},
      onLose: () => {},
      onSelectedBallMotion: () => {},
    };

    const { root, container } = mount({ ...common, ballShape: 'circle', applyShapeToExisting: false });

    await act(async () => {
      ref.current?.resetBalls?.();
    });
    expect(lastSnapshot.length).toBeGreaterThan(0);
    expect(lastSnapshot.every(b => b.shape === 'circle')).toBe(true);

    // Change shape to 'square' with checkbox off; existing balls should remain 'circle'
    await act(async () => {
      root.render(React.createElement(Canvas, { ...common, ref, ballShape: 'square', applyShapeToExisting: false }));
    });
    // Force a snapshot without changing physics state materially
    await act(async () => {
      ref.current?.applyColorScheme?.({});
    });
    expect(lastSnapshot.length).toBeGreaterThan(0);
    expect(lastSnapshot.every(b => b.shape === 'circle')).toBe(true);

    // Now enable checkbox and change shape again; existing should update this time
    await act(async () => {
      root.render(React.createElement(Canvas, { ...common, ref, ballShape: 'triangle', applyShapeToExisting: true }));
    });
    // Effect runs on prop change; force a snapshot
    await act(async () => {
      ref.current?.applyColorScheme?.({});
    });
    expect(lastSnapshot.every(b => b.shape === 'triangle')).toBe(true);

    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });
});
