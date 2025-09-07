/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Canvas from '../src/components/Canvas.jsx';

function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return { container, root, unmount: () => root.unmount() };
}

describe('Canvas.removeBall no-op when pop/despawn disabled', () => {
  it('does not remove a ball when gameplay.popDespawnEnabled is false', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    const ref = createRef();
    const noop = () => {};
    const gameplay = { popDespawnEnabled: false, healthSystem: false };
    let lastSnapshot = [];
    const onBallsSnapshot = (snap) => { lastSnapshot = snap; };

    const { unmount } = mount(
      React.createElement(Canvas, {
        ref,
        enableGravity: false,
        gravityStrength: 0,
        ballVelocity: 5,
        deformation: { enabled: false, intensity: 1, speed: 0.05, ease: 'power2.out' },
        gameplay,
        backgroundColor: '#000000',
        trailOpacity: 0,
        setGlobalScore: noop,
        _selectedBall: null,
        onSelectedBallChange: noop,
        onBallsSnapshot,
        isPaused: true,
        level: null,
        setScoredBallsCount: noop,
        setRemovedBallsCount: noop,
        ballCount: 3,
        ballSize: 20,
        ballShape: 'circle',
        applyShapeToExisting: false,
        newBallSize: 20,
        onWin: noop,
        onLose: noop,
        onSelectedBallMotion: noop,
      })
    );

    // Seed/reset to ensure deterministic starting state
    await act(async () => { ref.current?.resetBalls?.(); });
    const baseCount = lastSnapshot.length;

    // Snapshot before
    await act(async () => { ref.current?.addBall?.(); });
    const afterAdd = lastSnapshot.length;
    // Try to remove ball with toggle off (should be a no-op)
    await act(async () => { ref.current?.removeBall?.(); });
    const afterRemoveAttempt = lastSnapshot.length;

    // Add again to ensure still possible and count unchanged from remove
    await act(async () => { ref.current?.addBall?.(); });
    const afterSecondAdd = lastSnapshot.length;

    // After first add
    expect(afterAdd).toBe(baseCount + 1);
    // Remove did nothing
    expect(afterRemoveAttempt).toBe(afterAdd);
    // Second add increases by 1
    expect(afterSecondAdd).toBe(afterAdd + 1);

    unmount();
  });
});
