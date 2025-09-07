import { describe, it, expect } from 'vitest';
import { solveCollisions } from '../src/utils/physics.jsx';

// Minimal Ball stub matching required properties
class BallStub {
  constructor({ x, y, size = 10, isStartingBall: _isStartingBall = false }) {
    this.x = x; this.y = y; this.size = size;
    this.velX = 0; this.velY = 0;
    this.isStatic = false; this.isSleeping = false;
    this.shape = 'circle'; this.color = 'rgb(0,0,0)';
    this.health = 100; this.collisionCount = 0;
  }
  applyWallDeformation() {}
  applyBallDeformation() {}
}

function circleGoal(x, y, radius, color = 'rgb(0,255,0)') {
  return { x, y, shape: 'circle', radius, color, type: 'goal' };
}

function makeLevelWithGoal(goal) {
  return { type: 'gravityGauntlet', hazards: [], goals: [goal] };
}

describe('solveCollisions goal interactions', () => {
  it('scores/removes non-starting balls that hit the goal (win path)', () => {
  const balls = [
      new BallStub({ x: 0, y: 0, size: 10, isStartingBall: true }), // player
      new BallStub({ x: 95, y: 100, size: 10 }), // non-player near goal
    ];
    balls[0].isStartingBall = true;
  const goal = circleGoal(100, 100, 20);
  const level = makeLevelWithGoal(goal);

    let score = 0;
    let scored = 0;
  const incScore = () => { score += 1; };
  const incScored = () => { scored += 1; };
  const incRemoved = () => {};

  // Force overlap with goal for second ball but avoid distance==0
  balls[1].x = 90; balls[1].y = 100; // distance=10 < combinedRadius(30)

    solveCollisions(balls, false, 1, {}, incScore, level, incScored, incRemoved, () => {});

    expect(score).toBe(1);          // scored once
    expect(scored).toBe(1);         // scored counter incremented
    expect(balls.length).toBe(1);   // non-player removed
    expect(balls[0].isStartingBall).toBe(true);
  });

  it('invokes onPlayerHitGoal when starting ball hits the goal (lose path)', () => {
  const balls = [ new BallStub({ x: 110, y: 100, size: 10, isStartingBall: true }) ]; // distance=10 < combinedRadius(30)
    balls[0].isStartingBall = true;
    const _goal2 = circleGoal(100, 100, 20);
    const level = makeLevelWithGoal(_goal2);

    let loseCalled = false;
    const onLose = () => { loseCalled = true; };

    solveCollisions(balls, false, 1, {}, () => {}, level, () => {}, () => {}, onLose);

    expect(loseCalled).toBe(true);
    expect(balls.length).toBe(1); // player not removed by scoring logic
  });
});
