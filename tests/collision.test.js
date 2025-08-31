import { describe, it, expect } from 'vitest';
import { initializeBalls, solveCollisions } from '../src/utils/physics';

function makeBallsColliding() {
  const balls = [];
  initializeBalls(balls, 0, 20, 0, 800, 600, 'circle');
  // Two balls heading towards each other
  balls.push({
    id: 1, x: 390, y: 300, velX: 2, velY: 0, color: 'rgb(0,0,0)', originalColor: 'rgb(0,0,0)', size: 20,
    shape: 'circle', isStatic: false, scaleX: 1, scaleY: 1, deformAngle: 0, isAnimating: false,
    lastAnimationTime: 0, lastCollisionTime: 0, collisionCount: 0, health: 100, isSleeping: false,
    applyBallDeformation() {}, applyWallDeformation() {}
  });
  balls.push({
    id: 2, x: 410, y: 300, velX: -2, velY: 0, color: 'rgb(0,0,0)', originalColor: 'rgb(0,0,0)', size: 20,
    shape: 'circle', isStatic: false, scaleX: 1, scaleY: 1, deformAngle: 0, isAnimating: false,
    lastAnimationTime: 0, lastCollisionTime: 0, collisionCount: 0, health: 100, isSleeping: false,
    applyBallDeformation() {}, applyWallDeformation() {}
  });
  return balls;
}

describe('solveCollisions', () => {
  it('increments collision counts and adjusts velocities', () => {
    const balls = makeBallsColliding();
    solveCollisions(balls, false, 0, { enabled: false }, null, null, null);
    expect(balls[0].collisionCount).toBeGreaterThanOrEqual(1);
    expect(balls[1].collisionCount).toBeGreaterThanOrEqual(1);
    // Post-collision velocities should be separated (not both towards each other)
    expect(Math.sign(balls[0].velX)).toBeLessThanOrEqual(0);
    expect(Math.sign(balls[1].velX)).toBeGreaterThanOrEqual(0);
  });
});
