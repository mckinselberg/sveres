import { DEFAULTS } from '../js/config.jsx';
import { gsap } from 'gsap';
import { getControlsPanel } from './dom.js';
import { Ball } from './Ball.ts';
import { ENGINE_CONSTANTS } from '../js/physics.constants.js';
import { GRAVITY_GAUNTLET_CONSTANTS } from '../js/levels/gravityGauntlet.constants.js';

const LEVEL_CONSTANTS_MAP = {
    gravityGauntlet: GRAVITY_GAUNTLET_CONSTANTS?.PHYSICS
};

// Utility functions
export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function colorWithAlpha(color, alpha = 1) {
    try {
        if (typeof color !== 'string') return color;
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
    } catch (e) {
        return color;
    }
}

function parseRgb(rgbString) {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10)
        };
    }
    return null;
}

// Ball class




    

// Handles the collision response between two balls.
// This function applies positional correction, resolves velocities based on elastic collision physics,
// applies deformation effects, updates health, and increments the global score.
export function handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore, physicsConsts = ENGINE_CONSTANTS) {
    // 1. Positional Correction: Separate balls to prevent sticking
    const overlap = combinedRadius - distance;
    const separationFactor = overlap / 2 + 0.5; // Add a small buffer
    ball1.x -= normalX * separationFactor;
    ball1.y -= normalY * separationFactor;
    ball2.x += normalX * separationFactor;
    ball2.y += normalY * separationFactor;

    // 2. Velocity Resolution: Apply elastic collision physics with mass proportional to size
    const elasticity = (physicsConsts?.COLLISION_ELASTICITY ?? ENGINE_CONSTANTS.COLLISION_ELASTICITY);
    const m1 = Math.max(1, ball1.size);
    const m2 = Math.max(1, ball2.size);
    const tangentX = -normalY;
    const tangentY = normalX;

    // Project velocities onto normal and tangent vectors
    const v1n = ball1.velX * normalX + ball1.velY * normalY;
    const v2n = ball2.velX * normalX + ball2.velY * normalY;
    const v1t = ball1.velX * tangentX + ball1.velY * tangentY;
    const v2t = ball2.velX * tangentX + ball2.velY * tangentY;

    // New normal velocities using 1D collision formula for masses m1, m2
    // v1' = ((m1 - e m2) v1 + (1+e) m2 v2) / (m1 + m2)
    // v2' = ((m2 - e m1) v2 + (1+e) m1 v1) / (m1 + m2)
    const denom = (m1 + m2) || 1;
    const v1n_final = (((m1 - elasticity * m2) * v1n) + ((1 + elasticity) * m2 * v2n)) / denom;
    const v2n_final = (((m2 - elasticity * m1) * v2n) + ((1 + elasticity) * m1 * v1n)) / denom;

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

    // 5. Scoring: Increment global score for every collision
    if (setGlobalScore) {
        setGlobalScore(prevScore => prevScore + 1);
    }
}

// Iteratively solves collisions between all balls in the simulation.
// This function performs multiple iterations to ensure stable collision resolution,
// especially for stacked or multi-ball collisions.
export function solveCollisions(balls, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore, level, setScoredBallsCount, setRemovedBallsCount, onPlayerHitGoal, selectedBall) {
    const phys = (level && LEVEL_CONSTANTS_MAP[level.type]) || ENGINE_CONSTANTS;
    const iterations = phys.COLLISION_ITERATIONS; // Number of iterations for stable collision resolution
    const dynamicBalls = balls.filter(ball => !ball.isStatic);
    const staticObjects = [];

    if (level && level.hazards) {
        level.hazards.forEach(hazard => {
            staticObjects.push({
                x: hazard.x,
                y: hazard.y,
                size: hazard.shape === 'circle' ? hazard.radius : Math.max(hazard.width, hazard.height) / 2, // Approximate size for collision
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
                size: goal.shape === 'circle' ? goal.radius : Math.max(goal.width, goal.height) / 2, // Approximate size for collision
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

                    ball1.x -= normalX * overlap / 2;
                    ball1.y -= normalY * overlap / 2;
                    ball2.x += normalX * overlap / 2;
                    ball2.y += normalY * overlap / 2;

                    if (ball1.isSleeping) ball1.isSleeping = false;
                    if (ball2.isSleeping) ball2.isSleeping = false;

                    const relativeVelX = ball2.velX - ball1.velX;
                    const relativeVelY = ball2.velY - ball1.velY;
                    const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;

                    if (velAlongNormal < 0) { // Only resolve if balls are moving towards each other
                        handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore, phys);
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

                if (distance < combinedRadius) {
                    // Support distance === 0 by using a default normal and full overlap
                    const overlap = distance === 0 ? combinedRadius : (combinedRadius - distance);
                    const inv = distance === 0 ? 0 : 1 / distance;
                    const normalX = distance === 0 ? 1 : dx * inv;
                    const normalY = distance === 0 ? 0 : dy * inv;

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
            } else if (staticObj.type === 'goal') {
                        // Only score/remove non-starting balls; the starting ball is the player and should not be removed
                        const isControlled = selectedBall && ball.id === selectedBall.id;
                        const isPlayer = isControlled || ball.isStartingBall;
                        if (!isPlayer) {
                if (setGlobalScore) setGlobalScore(prevScore => prevScore + 1);
                            if (setScoredBallsCount) setScoredBallsCount(prev => prev + 1);
                            // Remove ball after scoring
                            const index = balls.indexOf(ball);
                            if (index > -1) {
                                balls.splice(index, 1);
                            }
                        } else {
                            // Player hit the goal -> lose condition
                            if (onPlayerHitGoal) onPlayerHitGoal();
                        }
                    }
                }
            }
        }
    }
}

/**
 * @typedef {import('./Ball.jsx').Ball} BallClass
 */

/**
 * @param {BallClass[]} balls
 * @param {number} ballCount
 * @param {number} ballSize
 * @param {number} ballVelocity
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {string} ballShape
 */
export function initializeBalls(balls, ballCount, ballSize, ballVelocity, canvasWidth, canvasHeight, ballShape, startingBallSizeOverride) {
    for (let i = 0; i < ballCount; i++) {
    const isStartingBall = i === 0;
    const baseSize = Math.max(1, random(ballSize - 20, ballSize + 20));
    const size = (isStartingBall && startingBallSizeOverride != null) ? startingBallSizeOverride : baseSize;

        const ball = new Ball(
            isStartingBall ? canvasWidth / 2 : random(0 + size, canvasWidth - size),
            isStartingBall ? size + 20 : random(0 + size, canvasHeight - size),
            isStartingBall ? 0 : random(-ballVelocity, ballVelocity),
            isStartingBall ? 0 : random(-ballVelocity, ballVelocity),
            'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
            size,
            ballShape
        );
        ball._lastMultiplier = 1;
        ball.isStartingBall = isStartingBall;
    ball.originalColor = ball.color;
    balls.push(ball);
    }
}

/**
 * @param {BallClass[]} balls
 */
export function addNewBall(balls, ballSize, ballVelocity, canvasWidth, canvasHeight, x = null, y = null, ballShape = DEFAULTS.ballShape, isStatic = false) {
    const size = ballSize;
    let attempts = 0;
    let newX = x;
    let newY = y;
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

    const shapeToUse = ballShape === 'mixed' ?
        ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star'][Math.floor(Math.random() * 8)] :
        ballShape;

    const ball = new Ball(
        newX, newY,
        random(-ballVelocity, ballVelocity),
        random(-ballVelocity, ballVelocity),
        'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
        size,
        shapeToUse,
        isStatic
    );
    ball._lastMultiplier = 1;
    ball.originalColor = ball.color;
    balls.push(ball);
}

/**
 * @param {BallClass[]} balls
 */
export function adjustBallCount(balls, targetCount, ballSize, ballVelocity, canvasWidth, canvasHeight) {
    while (balls.length < targetCount) {
        addNewBall(balls, ballSize, ballVelocity, canvasWidth, canvasHeight);
    }
    while (balls.length > targetCount && balls.length > 0) {
        balls.pop();
    }
}

/**
 * @param {BallClass[]} balls
 */
export function adjustBallVelocities(balls, maxVelocity) {
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

/**
 * @param {BallClass[]} balls
 */
export function resetAllBalls(balls, ballCount, ballSize, ballVelocity, canvasWidth, canvasHeight, ballShape) {
    balls.length = 0;
    initializeBalls(balls, ballCount, ballSize, ballVelocity, canvasWidth, canvasHeight, ballShape);
}

export function removeBall(balls, ballToRemove) {
    const index = balls.indexOf(ballToRemove);
    if (index > -1) {
        balls.splice(index, 1);
    }
}

export function detectCollisions(balls, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore) {
    const currentTime = Date.now();
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
                    handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore);
                }
            }
        }
    }
}

export function loop(ctx, balls, canvasWidth, canvasHeight, physicsSettings, backgroundColor, currentClearAlpha, setGlobalScore, selectedBall, level, setScoredBallsCount, setRemovedBallsCount, onPlayerHitGoal) {
    ctx.fillStyle = colorWithAlpha(backgroundColor, currentClearAlpha);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Helper function to draw static shapes
    const drawStaticShape = (shapeData) => {
        ctx.save();
        ctx.fillStyle = shapeData.color;
        ctx.beginPath();

        if (shapeData.shape === 'circle') {
            ctx.arc(shapeData.x, shapeData.y, shapeData.radius, 0, 2 * Math.PI);
        } else if (shapeData.shape === 'square') {
            ctx.fillRect(shapeData.x - shapeData.width / 2, shapeData.y - shapeData.height / 2, shapeData.width, shapeData.height);
        }
        // Add more shapes as needed (triangle, diamond, etc.)
        ctx.fill();
        ctx.restore();
    };

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];

        if (ball.isSleeping) {
            ball.draw(ctx, selectedBall);
            continue;
        }

        ball.draw(ctx, selectedBall);
        ball.update(canvasWidth, canvasHeight, physicsSettings.enableGravity ? physicsSettings.gravityStrength : 0, physicsSettings.ballVelocity, physicsSettings.deformation);
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

    solveCollisions(balls, physicsSettings.gameplay.healthSystem, physicsSettings.gameplay.healthDamageMultiplier, physicsSettings.deformation, setGlobalScore, level, setScoredBallsCount, setRemovedBallsCount, onPlayerHitGoal, selectedBall);
}