// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Mock Canvas to expose imperative updateSelectedBall and selected-ball presence
vi.mock('../src/components/Canvas.jsx', async () => {
  const React = await import('react');
  const getStore = () => {
    if (!('___updateCalls' in window)) {
      Object.defineProperty(window, '___updateCalls', { value: [], writable: true });
    }
    return window.___updateCalls;
  };
  const CanvasMock = React.forwardRef(function CanvasMock(props, ref) {
    React.useImperativeHandle(ref, () => ({
      updateSelectedBall: (payload) => { getStore().push(payload); },
      jumpPlayer: () => {},
      slamPlayer: () => {},
      resetBalls: () => {},
      addBall: () => {},
      removeBall: () => {},
    }));
    React.useEffect(() => {
      props.onSelectedBallChange?.({ id: 'p1', velX: 0, velY: 0, controlTuning: {} });
    }, []);
    return React.createElement('div', { 'data-canvas-mock': '1' });
  });
  const getCalls = () => getStore();
  const clearCalls = () => { const s = getStore(); s.length = 0; };
  return { default: CanvasMock, getCalls, clearCalls };
});

// Ensure app starts in gauntlet mode
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sim:levelMode', 'true');
});

describe.skip('WASD movement in Gravity Gauntlet', () => {
  it('accelerates right on D, left on A, and is neutral when A and D are both held', async () => {
  const App = (await import('../src/App.jsx')).default;
  const { getCalls, clearCalls } = await import('../src/components/Canvas.jsx');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(React.createElement(App));

    // Make RAF immediate-ish
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 0);
    });
    const waitFrames = (ms = 50) => new Promise(r => setTimeout(r, ms));
    // Allow effects to run and selection to propagate
    await waitFrames(30);

    // D -> expect positive velX update (poll up to ~500ms)
    clearCalls();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    let callsAfterD = [];
    for (let i = 0; i < 10; i++) {
      await waitFrames(50);
      callsAfterD = getCalls();
      if (callsAfterD.length > 0) break;
    }
    expect(callsAfterD.length).toBeGreaterThan(0);
    expect(callsAfterD.some(c => typeof c.velX === 'number' && c.velX > 0)).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));

    // A -> expect negative velX update (poll)
    clearCalls();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    let callsAfterA = [];
    for (let i = 0; i < 10; i++) {
      await waitFrames(50);
      callsAfterA = getCalls();
      if (callsAfterA.length > 0) break;
    }
    expect(callsAfterA.length).toBeGreaterThan(0);
    expect(callsAfterA.some(c => typeof c.velX === 'number' && c.velX < 0)).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

    // A + D together -> neutral (no update since target==current/coast)
    clearCalls();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
  await waitFrames(150);
    const callsNeutral = getCalls();
    expect(callsNeutral.length).toBe(0);
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
  // Unmount
  root.unmount();
  container.remove();
  rafSpy.mockRestore();
  });
});

