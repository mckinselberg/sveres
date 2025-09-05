import { DEFAULTS } from '../js/config.jsx';
import { Ball } from './Ball';
import type { DeformationSettings } from './Ball';

// Local types to describe settings and level structures
export type StateNumberUpdater = ((fn: (prev: number) => number) => void) | null | undefined;

export interface VisualsSettings {
  backgroundColor: string;
  trailOpacity: number;
  uiOpacity: number;
}

export interface GameplaySettings {
  scoring: boolean;
  sandbox: boolean;
  healthSystem: boolean;
  healthDamageMultiplier: number;
}

export type LevelShape = 'circle' | 'square' | string;

export interface LevelObject {
  x: number;
  y: number;
  color: string;
  shape: LevelShape;
  radius?: number;
  width?: number;
  height?: number;
  isStatic?: boolean;
}

export interface LevelDefinition {
  type?: string;
  hazards?: LevelObject[];
  goals?: LevelObject[];
}

export interface PhysicsSettings {
  enableGravity: boolean;
  gravityStrength: number;
  ballShape: string;
  ballSize: number;
  ballVelocity: number;
  deformation: DeformationSettings;
  visuals: VisualsSettings;
  gameplay: GameplaySettings;
  level?: LevelDefinition | null;
}

// Utility functions
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function colorWithAlpha(color: string, alpha: number = 1): string {
  try {
    if (typeof color !== 'string') return color as unknown as string;
    const rgbMatch = color.match(/^\s*rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)\s*$/i);
    if (rgbMatch) {
      const r = Math.min(255, parseInt(rgbMatch[1], 10));
      const g = Math.min(255, parseInt(rgbMatch[2], 10));
      const b = Math.min(255, parseInt(rgbMatch[3], 10));
      const a = Math.max(0, Math.min(1, alpha));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = Math.max(0, Math.min(1, alpha));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return color;
  } catch {
    return color;
  }
}

// Handles the collision response between two balls.
// This function applies positional correction, resolves velocities based on elastic collision physics,
// applies deformation effects, updates health, and increments the global score.
export function handleBallCollision(
  ball1: Ball,
  ball2: Ball,
  dx: number,
  dy: number,
  distance: number,
  combinedRadius: number,
  normalX: number,
  normalY: number,
  healthSystemEnabled: boolean,
  healthDamageMultiplier: number,
  deformationSettings: DeformationSettings,
  setGlobalScore?: StateNumberUpdater
): void {
  // 1. Positional Correction: Separate balls to prevent sticking
  const overlap = combinedRadius - distance;
  const separationFactor = overlap / 2 + 0.5; // Add a small buffer
  ball1.x -= normalX * separationFactor;
  ball1.y -= normalY * separationFactor;
  ball2.x += normalX * separationFactor;
  ball2.y += normalY * separationFactor;

  // 2. Velocity Resolution: Apply elastic collision physics
  const elasticity = 0.9; // Coefficient of restitution
  const tangentX = -normalY;
  const tangentY = normalX;

  // Project velocities onto normal and tangent vectors
  const v1n = ball1.velX * normalX + ball1.velY * normalY;
  const v2n = ball2.velX * normalX + ball2.velY * normalY;
  const v1t = ball1.velX * tangentX + ball1.velY * tangentY;
  const v2t = ball2.velX * tangentX + ball2.velY * tangentY;

  // New normal velocities (using 1D collision formula for equal mass)
  const v1n_final = (v1n * (1 - elasticity) + 2 * v2n) / 2;
  const v2n_final = (v2n * (1 - elasticity) + 2 * v1n) / 2;

  // Convert scalar normal and tangential velocities back to vectors
  ball1.velX = v1n_final * normalX + v1t * tangentX;
  ball1.velY = v1n_final * normalY + v1t * tangentY;
  ball2.velX = v2n_final * normalX + v2t * tangentX;
  ball2.velY = v2n_final * normalY + v2t * tangentY;

  // 3. Visual Feedback: Apply deformation based on impact intensity
  const relativeSpeed = Math.abs(v1n - v2n);
  const intensity = Math.min(relativeSpeed / 15, 1); // Normalize intensity

  ball1.applyBallDeformation(normalX, normalY, intensity, deformationSettings);
  ball2.applyBallDeformation(-normalX, -normalY, intensity, deformationSettings);

  // 4. Health System: Apply damage if enabled
  if (healthSystemEnabled) {
    const healthDamage = intensity * healthDamageMultiplier; // More intense collisions cause more damage
    ball1.health -= healthDamage;
    ball2.health -= healthDamage;
    ball1.health = Math.max(0, ball1.health); // Ensure health doesn't go below 0
    ball2.health = Math.max(0, ball2.health);
  }

  // 5. Collision Count: Increment collision count for both balls
  ball1.collisionCount++;
  ball2.collisionCount++;

  // 6. Scoring: Increment global score for every collision
  if (setGlobalScore) {
    setGlobalScore(prevScore => prevScore + 1);
  }
}

// Iteratively solves collisions between all balls in the simulation.
// This function performs multiple iterations to ensure stable collision resolution,
// especially for stacked or multi-ball collisions.
export function solveCollisions(
  balls: Ball[],
  healthSystemEnabled: boolean,
  healthDamageMultiplier: number,
  deformationSettings: DeformationSettings,
  setGlobalScore?: StateNumberUpdater,
  level?: LevelDefinition | null,
  setScoredBallsCount?: StateNumberUpdater,
  setRemovedBallsCount?: StateNumberUpdater
): void {
  const iterations = 5; // Number of iterations for stable collision resolution
  const dynamicBalls = balls.filter(ball => !ball.isStatic);
  const staticObjects: Array<{
    x: number; y: number; size: number; shape: LevelShape; color: string; isStatic: true; type: 'hazard' | 'goal'
  }> = [];

  if (level && level.hazards) {
    level.hazards.forEach(hazard => {
      staticObjects.push({
        x: hazard.x,
        y: hazard.y,
        size: hazard.shape === 'circle' ? (hazard.radius || 0) : Math.max(hazard.width || 0, hazard.height || 0) / 2, // Approximate size for collision
        shape: hazard.shape,
        color: hazard.color,
        isStatic: true,
        type: 'hazard'
      });
    });
  }

  if (level && level.goals) {
    level.goals.forEach(goal => {
      staticObjects.push({
        x: goal.x,
        y: goal.y,
        size: goal.shape === 'circle' ? (goal.radius || 0) : Math.max(goal.width || 0, goal.height || 0) / 2, // Approximate size for collision
        shape: goal.shape,
        color: goal.color,
        isStatic: true,
        type: 'goal'
      });
    });
  }

  for (let k = 0; k < iterations; k++) {
    // Collisions between dynamic balls
    for (let i = 0; i < dynamicBalls.length; i++) {
      for (let j = i + 1; j < dynamicBalls.length; j++) {
        const ball1 = dynamicBalls[i];
        const ball2 = dynamicBalls[j];

        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadius = ball1.size + ball2.size;

        if (distance < combinedRadius && distance > 0) {
          const overlap = combinedRadius - distance;
          const normalX = dx / distance;
          const normalY = dy / distance;

          ball1.x -= (normalX * overlap) / 2;
          ball1.y -= (normalY * overlap) / 2;
          ball2.x += (normalX * overlap) / 2;
          ball2.y += (normalY * overlap) / 2;

          if (ball1.isSleeping) ball1.isSleeping = false;
          if (ball2.isSleeping) ball2.isSleeping = false;

          const relativeVelX = ball2.velX - ball1.velX;
          const relativeVelY = ball2.velY - ball1.velY;
          const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;

          if (velAlongNormal < 0) {
            // Only resolve if balls are moving towards each other
            handleBallCollision(
              ball1,
              ball2,
              dx,
              dy,
              distance,
              combinedRadius,
              normalX,
              normalY,
              healthSystemEnabled,
              healthDamageMultiplier,
              deformationSettings,
              setGlobalScore
            );
          }
        }
      }
    }

    // Collisions between dynamic balls and static objects
    for (let i = 0; i < dynamicBalls.length; i++) {
      const ball = dynamicBalls[i];

      for (let j = 0; j < staticObjects.length; j++) {
        const staticObj = staticObjects[j];

        const dx = staticObj.x - ball.x;
        const dy = staticObj.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadius = ball.size + staticObj.size; // Using approximate size for static objects

        if (distance < combinedRadius && distance > 0) {
          const overlap = combinedRadius - distance;
          const normalX = dx / distance;
          const normalY = dy / distance;

          // Separate the dynamic ball from the static object
          ball.x -= normalX * overlap;
          ball.y -= normalY * overlap;

          // Reflect velocity for dynamic ball
          const dotProduct = (ball.velX * normalX + ball.velY * normalY) * 2;
          ball.velX -= dotProduct * normalX;
          ball.velY -= dotProduct * normalY;

          // Apply deformation to the dynamic ball
          ball.applyWallDeformation(normalX, normalY, deformationSettings);

          if (staticObj.type === 'hazard' && healthSystemEnabled) {
            const damage = healthDamageMultiplier * 100; // Use 100 to make it a percentage
            ball.health -= damage;
            ball.health = Math.max(0, ball.health);
            // Flash the ball red
            const originalColor = ball.color;
            ball.color = 'red';
            setTimeout(() => {
              ball.color = originalColor;
            }, 200);

            // Remove ball if health is zero
            if (ball.health <= 0) {
              const index = balls.indexOf(ball);
              if (index > -1) {
                balls.splice(index, 1);
                if (setRemovedBallsCount) setRemovedBallsCount(prev => prev + 1);
              }
            }
          } else if (staticObj.type === 'goal' && setGlobalScore) {
            setGlobalScore(prevScore => prevScore + 1);
            if (setScoredBallsCount) setScoredBallsCount(prev => prev + 1);
            // Remove ball after scoring
            const index = balls.indexOf(ball);
            if (index > -1) {
              balls.splice(index, 1);
            }
          }
        }
      }
    }
  }
}

export function initializeBalls(
  balls: Ball[],
  ballCount: number,
  ballSize: number,
  ballVelocity: number,
  canvasWidth: number,
  canvasHeight: number,
  ballShape: string
): void {
  for (let i = 0; i < ballCount; i++) {
    const size = Math.max(1, random(ballSize - 20, ballSize + 20));
    const isStartingBall = i === 0;

    const ball = new Ball(
      isStartingBall ? canvasWidth / 2 : random(0 + size, canvasWidth - size),
      isStartingBall ? size + 20 : random(0 + size, canvasHeight - size),
      isStartingBall ? 0 : random(-ballVelocity, ballVelocity),
      isStartingBall ? 0 : random(-ballVelocity, ballVelocity),
      'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
      size,
      ballShape as any
    );
    (ball as any)._lastMultiplier = 1;
    (ball as any).isStartingBall = isStartingBall;
    ball.originalColor = ball.color;
    balls.push(ball);
  }
}

export function addNewBall(
  balls: Ball[],
  ballSize: number,
  ballVelocity: number,
  canvasWidth: number,
  canvasHeight: number,
  x: number | null = null,
  y: number | null = null,
  ballShape: string = DEFAULTS.ballShape,
  isStatic: boolean = false
): void {
  const size = ballSize;
  let attempts = 0;
  let newX = x as number | null;
  let newY = y as number | null;
  let validPosition = false;

  if (newX === null || newY === null) {
    while (!validPosition && attempts < 50) {
      newX = random(size, canvasWidth - size);
      newY = random(size, canvasHeight - size);
      validPosition = true;
      for (let ball of balls) {
        const distance = Math.sqrt((newX - ball.x) ** 2 + (newY - ball.y) ** 2);
        if (distance < size + ball.size + 10) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }
    if (!validPosition) {
      newX = random(size, canvasWidth - size);
      newY = random(size, canvasHeight - size);
    }
  }

  const shapeToUse = ballShape === 'mixed'
    ? (['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star'] as const)[Math.floor(Math.random() * 8)]
    : ballShape;

  const ball = new Ball(
    (newX as number), (newY as number),
    random(-ballVelocity, ballVelocity),
    random(-ballVelocity, ballVelocity),
    'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
    size,
    shapeToUse as any,
    isStatic
  );
  (ball as any)._lastMultiplier = 1;
  ball.originalColor = ball.color;
  balls.push(ball);
}

export function adjustBallCount(
  balls: Ball[],
  targetCount: number,
  ballSize: number,
  ballVelocity: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  while (balls.length < targetCount) {
    addNewBall(balls, ballSize, ballVelocity, canvasWidth, canvasHeight);
  }
  while (balls.length > targetCount && balls.length > 0) {
    balls.pop();
  }
}

export function adjustBallVelocities(balls: Ball[], maxVelocity: number): void {
  balls.forEach(ball => {
    const currentSpeed = Math.sqrt(ball.velX * ball.velX + ball.velY * ball.velY);
    if (currentSpeed > 0) {
      const ratio = maxVelocity / currentSpeed;
      ball.velX *= ratio;
      ball.velY *= ratio;
    } else {
      ball.velX = random(-maxVelocity, maxVelocity);
      ball.velY = random(-maxVelocity, maxVelocity);
    }
  });
}

export function resetAllBalls(
  balls: Ball[],
  ballCount: number,
  ballSize: number,
  ballVelocity: number,
  canvasWidth: number,
  canvasHeight: number,
  ballShape: string
): void {
  balls.length = 0;
  initializeBalls(balls, ballCount, ballSize, ballVelocity, canvasWidth, canvasHeight, ballShape);
}

export function removeBall(balls: Ball[], ballToRemove: Ball): void {
  const index = balls.indexOf(ballToRemove);
  if (index > -1) {
    balls.splice(index, 1);
  }
}

export function detectCollisions(
  balls: Ball[],
  healthSystemEnabled: boolean,
  healthDamageMultiplier: number,
  deformationSettings: DeformationSettings,
  setGlobalScore?: StateNumberUpdater
): void {
  const currentTime = Date.now();
  // Cache controls panel rect once per frame (TS path)
  let controlsRect: { left: number; top: number; right: number; bottom: number } | null = null;
  try {
    const panel = typeof document !== 'undefined' ? document.querySelector('.controls-panel') as HTMLElement | null : null;
    if (panel) controlsRect = panel.getBoundingClientRect();
  } catch {}

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const ball1 = balls[i];
      const ball2 = balls[j];

      if (currentTime - ball1.lastCollisionTime < 20 || currentTime - ball2.lastCollisionTime < 20) {
        continue;
      }

      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = ball1.size + ball2.size;

      if (distance < combinedRadius && distance > 0) {
        const normalX = dx / distance;
        const normalY = dy / distance;

        const relativeVelX = ball1.velX - ball2.velX;
        const relativeVelY = ball1.velY - ball2.velY;
        const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;

        if (velAlongNormal > 0) {
          ball1.lastCollisionTime = currentTime;
          ball2.lastCollisionTime = currentTime;
          handleBallCollision(
            ball1,
            ball2,
            dx,
            dy,
            distance,
            combinedRadius,
            normalX,
            normalY,
            healthSystemEnabled,
            healthDamageMultiplier,
            deformationSettings,
            setGlobalScore
          );
        }
      }
    }
  }
}

export function loop(
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  canvasWidth: number,
  canvasHeight: number,
  physicsSettings: PhysicsSettings,
  backgroundColor: string,
  currentClearAlpha: number,
  setGlobalScore: StateNumberUpdater,
  selectedBall: Ball | null,
  level?: LevelDefinition | null,
  setScoredBallsCount?: StateNumberUpdater,
  setRemovedBallsCount?: StateNumberUpdater
): void {
  ctx.fillStyle = colorWithAlpha(backgroundColor, currentClearAlpha);
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Helper function to draw static shapes
  const drawStaticShape = (shapeData: LevelObject) => {
    ctx.save();
    ctx.fillStyle = shapeData.color;
    ctx.beginPath();

    if (shapeData.shape === 'circle') {
      ctx.arc(shapeData.x, shapeData.y, (shapeData.radius || 0), 0, 2 * Math.PI);
    } else if (shapeData.shape === 'square') {
      const w = shapeData.width || 0; const h = shapeData.height || 0;
      ctx.fillRect(shapeData.x - w / 2, shapeData.y - h / 2, w, h);
    }
    // Add more shapes as needed (triangle, diamond, etc.)
    ctx.fill();
    ctx.restore();
  };
  // Cache controls panel rect once per frame
  let controlsRect: { left: number; top: number; right: number; bottom: number } | undefined;
  try {
    const panel = typeof document !== 'undefined' ? (document.querySelector('.controls-panel') as HTMLElement | null) : null;
    if (panel) {
      const r = panel.getBoundingClientRect();
      controlsRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
  } catch {}

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (ball.isSleeping) {
      ball.draw(ctx as any, selectedBall);
      continue;
    }

    ball.draw(ctx as any, selectedBall);
    ball.update(
      canvasWidth,
      canvasHeight,
      physicsSettings.enableGravity ? physicsSettings.gravityStrength : 0,
      physicsSettings.ballVelocity,
      physicsSettings.deformation,
      controlsRect || undefined
    );
  }

  // Draw hazards
  if (level && level.hazards) {
    level.hazards.forEach(hazard => {
      drawStaticShape(hazard);
    });
  }

  // Draw goals
  if (level && level.goals) {
    level.goals.forEach(goal => {
      drawStaticShape(goal);
    });
  }

  solveCollisions(
    balls,
    physicsSettings.gameplay.healthSystem,
    physicsSettings.gameplay.healthDamageMultiplier,
    physicsSettings.deformation,
    setGlobalScore,
    level,
    setScoredBallsCount,
    setRemovedBallsCount
  );
}
