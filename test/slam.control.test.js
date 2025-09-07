// Run under node; provide minimal stubs for window/document
import { describe, it, expect } from 'vitest';
/** @vitest-environment jsdom */
import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Canvas from '../src/components/Canvas.jsx';

function mountCanvas(overrideProps = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref = createRef();
  act(() => {
    const baseProps = {
      ref,
      enableGravity: true,
      gravityStrength: 0.15,
      ballVelocity: 5,
      deformation: { enabled: true, intensity: 0.5, speed: 0.05, ease: 'power2.out', easeOverride: '' },
      gameplay: { scoring: false, sandbox: true, healthSystem: false, healthDamageMultiplier: 0.2 },
      backgroundColor: '#000000',
      trailOpacity: 0.2,
      setGlobalScore: () => {},
      selectedBall: null,
      onSelectedBallChange: () => {},
      isPaused: true,
  level: { type: 'sandboxLevel', hazards: [], goals: [] },
      setScoredBallsCount: () => {},
      setRemovedBallsCount: () => {},
      ballCount: 5,
      ballSize: 15,
      ballShape: 'circle',
      newBallSize: 15,
      onWin: () => {},
      onLose: () => {},
      onSelectedBallMotion: () => {},
    };
    root.render(React.createElement(Canvas, { ...baseProps, ...overrideProps }));
  });
  return { root, container, ref };
}

describe('slam control', () => {
  it('allows slam in non-gauntlet level mode when airborne and blocks on ground', async () => {
    // Provide window size for canvas sizing
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });

    let lastBall = null;
  const onSelectedBallChange = (b) => { if (b && b.id != null) lastBall = b; };
  const { ref, root, container } = mountCanvas({ onSelectedBallChange });

    // Replace onSelectedBallChange after mount to capture snapshots
    // Re-render with same tree but updated prop (act to flush)
    await act(async () => {
      ref.current?.resetBalls?.();
    });

    // Ensure we have a selected starting ball seeded in level mode
    expect(lastBall && lastBall.id != null).toBe(true);
    const id = lastBall.id;

    // Move the player to be airborne (y well above ground)
    await act(async () => {
      ref.current?.updateSelectedBall?.({ id, __allowXY: true, y: 100 });
    });

    // Capture velocity before slam
    const beforeVyAir = lastBall.velY || 0;
    await act(async () => {
      ref.current?.slamPlayer?.();
      // Trigger a snapshot to read the latest state
      ref.current?.updateSelectedBall?.({ id });
    });
    expect(lastBall.velY).toBeGreaterThanOrEqual(beforeVyAir);
    expect(lastBall.velY).toBeGreaterThan(0); // downward

    // Ground the player and ensure slam becomes a no-op
    const canvasHeight = 600; // from window.innerHeight
    const effR = lastBall.size; // scale assumed 1 in tests
    const groundY = canvasHeight - effR;
    await act(async () => {
      ref.current?.updateSelectedBall?.({ id, __allowXY: true, y: groundY });
    });
    const beforeVyGround = lastBall.velY;
    await act(async () => {
      ref.current?.slamPlayer?.();
      ref.current?.updateSelectedBall?.({ id });
    });
    expect(lastBall.velY).toBe(beforeVyGround); // unchanged when grounded

    // Cleanup
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('disables slam in gauntlet mode even when airborne', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    let lastBall = null;
    const onSelectedBallChange = (b) => { if (b && b.id != null) lastBall = b; };
    // mount with gauntlet level
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const ref = createRef();
    await act(async () => {
      const baseProps = {
        ref,
        enableGravity: true,
        gravityStrength: 0.15,
        ballVelocity: 5,
        deformation: { enabled: true, intensity: 0.5, speed: 0.05, ease: 'power2.out', easeOverride: '' },
        gameplay: { scoring: false, sandbox: false, healthSystem: false, healthDamageMultiplier: 0.2 },
        backgroundColor: '#000000',
        trailOpacity: 0.2,
        setGlobalScore: () => {},
        selectedBall: null,
        onSelectedBallChange,
        isPaused: true,
        level: { type: 'gravityGauntlet', hazards: [], goals: [] },
        setScoredBallsCount: () => {},
        setRemovedBallsCount: () => {},
        ballCount: 5,
        ballSize: 15,
        ballShape: 'circle',
        newBallSize: 15,
        onWin: () => {},
        onLose: () => {},
        onSelectedBallMotion: () => {},
      };
      root.render(React.createElement(Canvas, baseProps));
    });
    await act(async () => {
      ref.current?.resetBalls?.();
    });
    expect(lastBall && lastBall.id != null).toBe(true);
    const id = lastBall.id;
    await act(async () => {
      ref.current?.updateSelectedBall?.({ id, __allowXY: true, y: 100 });
    });
    const beforeVy = lastBall.velY || 0;
    await act(async () => {
      ref.current?.slamPlayer?.();
      ref.current?.updateSelectedBall?.({ id });
    });
    // Should remain unchanged due to gauntlet
    expect(lastBall.velY).toBe(beforeVy);
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });
});
