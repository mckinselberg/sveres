import { describe, it, expect } from 'vitest';
import { decideGasDir } from '../src/utils/inputDirection.js';

// -1 left, 1 right, 0 none

describe('decideGasDir', () => {
  it('follows instantaneous motion when gas is held', () => {
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:-0.5, activeDir:0, lastMotionDir:1 })).toBe(-1);
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:0.7, activeDir:0, lastMotionDir:-1 })).toBe(1);
  });

  it('falls back to exclusive input when no motion', () => {
    expect(decideGasDir({ hasLeft:true, hasRight:false, gas:true, velSign:0, activeDir:0, lastMotionDir:0 })).toBe(-1);
    expect(decideGasDir({ hasLeft:false, hasRight:true, gas:true, velSign:0, activeDir:0, lastMotionDir:0 })).toBe(1);
  });

  it('uses activeDir when neither moving nor exclusive inputs', () => {
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:0, activeDir:-1, lastMotionDir:0 })).toBe(-1);
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:0, activeDir:1, lastMotionDir:0 })).toBe(1);
  });

  it('uses lastMotionDir as the final fallback with gas', () => {
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:0, activeDir:0, lastMotionDir:-1 })).toBe(-1);
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:true, velSign:0, activeDir:0, lastMotionDir:1 })).toBe(1);
  });

  it('without gas, only responds to explicit inputs or activeDir', () => {
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:false, velSign:-1, activeDir:0, lastMotionDir:1 })).toBe(0);
    expect(decideGasDir({ hasLeft:true, hasRight:false, gas:false, velSign:1, activeDir:0, lastMotionDir:0 })).toBe(-1);
    expect(decideGasDir({ hasLeft:false, hasRight:false, gas:false, velSign:0, activeDir:1, lastMotionDir:0 })).toBe(1);
  });
});
