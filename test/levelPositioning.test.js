import { describe, it, expect } from 'vitest';
import { resolveLevelPos } from '../src/utils/levelPositioning.js';

describe('resolveLevelPos', () => {
  const W = 800, H = 600;

  it('supports center with offsets and percentages', () => {
    expect(resolveLevelPos({ x: 'center+10', y: 'middle-20' }, W, H)).toEqual({ x: 410, y: 280 });
  // 10% offset is of full dimension (W/H), not of half
  expect(resolveLevelPos({ x: 'center+10%', y: 'center-10%' }, W, H)).toEqual({ x: 480, y: 240 });
  });

  it('supports edges with offsets and object half-size compensation', () => {
    // circle radius compensated
    expect(resolveLevelPos({ shape: 'circle', radius: 20, x: 'right-10', y: 'bottom-10' }, W, H))
      .toEqual({ x: (W - 20) - 10, y: (H - 20) - 10 });
    // rect half-width/height compensated
    expect(resolveLevelPos({ width: 40, height: 60, x: 'left+10', y: 'top+10' }, W, H))
      .toEqual({ x: 20 + 10, y: 30 + 10 });
  });

  it('supports percentages for raw positions', () => {
    expect(resolveLevelPos({ x: '25%', y: '75%' }, W, H)).toEqual({ x: 200, y: 450 });
  });
});
