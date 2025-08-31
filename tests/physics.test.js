import { describe, it, expect } from 'vitest';
import { initializeBalls, adjustBallCount, adjustBallVelocities } from '../src/utils/physics';

function dummyCanvas(size = 800) {
  return { width: size, height: size };
}

describe('physics helpers', () => {
  it('initializeBalls creates the requested count with ids and originalColor', () => {
    const balls = [];
    const { width, height } = dummyCanvas();
    initializeBalls(balls, 5, 30, 5, width, height, 'circle');
    expect(balls.length).toBe(5);
    balls.forEach(b => {
      expect(typeof b.id).toBe('number');
      expect(typeof b.originalColor).toBe('string');
      expect(b.size).toBeGreaterThan(0);
    });
  });

  it('adjustBallCount grows or shrinks', () => {
    const balls = [];
    const { width, height } = dummyCanvas();
    initializeBalls(balls, 3, 30, 5, width, height, 'circle');
    adjustBallCount(balls, 6, 30, 5, width, height);
    expect(balls.length).toBe(6);
    adjustBallCount(balls, 2, 30, 5, width, height);
    expect(balls.length).toBe(2);
  });

  it('adjustBallVelocities normalizes to the target max velocity', () => {
    const balls = [];
    const { width, height } = dummyCanvas();
    initializeBalls(balls, 3, 30, 1, width, height, 'circle');
    // make one ball very fast
    balls[0].velX = 100; balls[0].velY = 0;
    adjustBallVelocities(balls, 10);
    const speed = Math.hypot(balls[0].velX, balls[0].velY);
    expect(speed).toBeCloseTo(10, 1);
  });
});
