import { DEFAULTS } from '../js/config.jsx';
import { gsap } from 'gsap';

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

// Ball class
export class Ball {
    constructor(x, y, velX, velY, color, size, shape = DEFAULTS.ballShape) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.collisionCount = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.color = color;
        this.originalColor = color;
        this.size = size;
        this.originalSize = size;
        this.shape = shape;
        this.scaleX = 1;
        this.scaleY = 1;
        this.deformAngle = 0;
        this.ripples = [];
        this.rippleCenter = { x: 0, y: 0 };
        this.isAnimating = false;
        this.lastAnimationTime = 0;
        this.lastCollisionTime = 0;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.isSleeping = false;
        this._lastMultiplier = 1;
        this.opacity = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.deformAngle);
        ctx.scale(this.scaleX, this.scaleY);

        ctx.beginPath();
        ctx.fillStyle = colorWithAlpha(this.originalColor, this.opacity);

        if (this.shape === 'circle') {
            ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
        } else if (this.shape === 'square') {
            ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        }
        else if (this.shape === 'triangle') {
            const halfSide = this.size * Math.sqrt(3) / 2;
            const topY = -this.size;
            const bottomY = this.size / 2;
            ctx.moveTo(0, topY);
            ctx.lineTo(-halfSide, bottomY);
            ctx.lineTo(halfSide, bottomY);
            ctx.closePath();
        }
        else if (this.shape === 'diamond') {
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size, 0);
            ctx.closePath();
        }
        else if (this.shape === 'pentagon') {
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 5), this.size * Math.sin(i * 2 * Math.PI / 5));
            }
            ctx.closePath();
        }
        else if (this.shape === 'hexagon') {
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 6), this.size * Math.sin(i * 2 * Math.PI / 6));
            }
            ctx.closePath();
        }
        else if (this.shape === 'octagon') {
            for (let i = 0; i < 8; i++) {
                ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 8), this.size * Math.sin(i * 2 * Math.PI / 8));
            }
            ctx.closePath();
        }
        else if (this.shape === 'star') {
            const outerRadius = this.size;
            const innerRadius = this.size / 2;
            const numPoints = 6;
            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < numPoints * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = Math.PI / numPoints * i;
                ctx.lineTo(radius * Math.sin(angle), -radius * Math.cos(angle));
            }
            ctx.closePath();
        }
        ctx.fill();

        ctx.restore();
    }

    applyWallDeformation(normalX, normalY, deformationSettings) {
        if (!deformationSettings.enabled) return;
        if (this.isAnimating) return;

        const { intensity, speed, ease, easeOverride } = deformationSettings;
        const deformationEase = easeOverride || ease;

        const velocityMagnitude = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
        const impactIntensity = Math.pow(Math.min(velocityMagnitude / 18, 1), 2) * intensity;
        const maxDeformation = 0.6;
        const deformationAmount = Math.min(impactIntensity, maxDeformation);
        const animationDuration = speed / (1 + impactIntensity * 2);

        this.deformAngle = Math.atan2(normalY, normalX);
        const compressionRatio = 1 - deformationAmount;
        const stretchRatio = 1 / compressionRatio;

        this.isAnimating = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.lastAnimationTime = Date.now();
                this.scaleX = 1;
                this.scaleY = 1;
            }
        });

        timeline
            .to(this, {
                scaleX: normalX !== 0 ? compressionRatio : stretchRatio,
                scaleY: normalY !== 0 ? compressionRatio : stretchRatio,
                duration: animationDuration,
                ease: "power3.out"
            })
            .to(this, {
                scaleX: 1,
                scaleY: 1,
                duration: animationDuration * 5,
                ease: deformationEase
            });
    }

    applyBallDeformation(normalX, normalY, intensity, deformationSettings) {
        if (!deformationSettings.enabled) return;
        if (this.isAnimating) return;

        const { speed, ease, easeOverride } = deformationSettings;
        const deformationEase = easeOverride || ease;

        const impactIntensity = Math.pow(intensity, 2) * deformationSettings.intensity;
        const maxDeformation = 0.6;
        const deformationAmount = Math.min(impactIntensity, maxDeformation);
        const animationDuration = speed / (1 + intensity * 2);

        this.deformAngle = Math.atan2(normalY, normalX);
        const compressionRatio = 1 - deformationAmount;
        const stretchRatio = 1 / compressionRatio;

        this.isAnimating = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.lastAnimationTime = Date.now();
                this.scaleX = 1;
                this.scaleY = 1;
            }
        });

        timeline
            .to(this, {
                scaleX: compressionRatio,
                scaleY: stretchRatio,
                duration: animationDuration,
                ease: "power3.out"
            })
            .to(this, {
                scaleX: 1,
                scaleY: 1,
                duration: animationDuration * 5,
                ease: deformationEase
            });
    }

    update(canvasWidth, canvasHeight, gravityStrength, maxVelocity, deformationSettings) {
        // Apply gravity if enabled
        if (gravityStrength > 0) {
            this.velY += gravityStrength;
        }

        // Velocity limiting
        if (Math.abs(this.velX) > maxVelocity) {
            this.velX = this.velX > 0 ? maxVelocity : -maxVelocity;
        }
        if (Math.abs(this.velY) > maxVelocity) {
            this.velY = this.velY > 0 ? maxVelocity : -maxVelocity;
        }

        const effectiveRadius = this.size * Math.max(this.scaleX, this.scaleY);

        let wallCollision = false;
        let wallNormalX = 0;
        let wallNormalY = 0;
        let isGrazingWall = false;

        // Right wall collision
        if ((this.x + effectiveRadius) >= canvasWidth) {
            const approachSpeed = this.velX;
            isGrazingWall = Math.abs(approachSpeed) < 2;
            if (isGrazingWall) {
                this.velX = -Math.abs(this.velX) * 0.7;
                this.x = canvasWidth - effectiveRadius - 1;
            } else {
                this.velX = -Math.abs(this.velX);
                this.x = canvasWidth - effectiveRadius - 1;
            }
            wallCollision = true;
            wallNormalX = -1;
            wallNormalY = 0;
        }

        // Left wall collision
        if ((this.x - effectiveRadius) <= 0) {
            const approachSpeed = -this.velX;
            isGrazingWall = Math.abs(approachSpeed) < 2;
            if (isGrazingWall) {
                this.velX = Math.abs(this.velX) * 0.7;
                this.x = effectiveRadius + 1;
            } else {
                this.velX = Math.abs(this.velX);
                this.x = effectiveRadius + 1;
            }
            wallCollision = true;
            wallNormalX = 1;
            wallNormalY = 0;
        }

        // Bottom wall collision
        if ((this.y + effectiveRadius) >= canvasHeight) {
            const approachSpeed = this.velY;
            isGrazingWall = Math.abs(approachSpeed) < 2;
            if (isGrazingWall) {
                this.velY = -Math.abs(this.velY) * 0.7;
                this.y = canvasHeight - effectiveRadius - 1;
            } else {
                this.velY = -Math.abs(this.velY);
                this.y = canvasHeight - effectiveRadius - 1;
            }
            wallCollision = true;
            wallNormalX = 0;
            wallNormalY = -1;
        }

        // Top wall collision
        if ((this.y - effectiveRadius) <= 0) {
            const approachSpeed = -this.velY;
            isGrazingWall = Math.abs(approachSpeed) < 2;
            if (isGrazingWall) {
                this.velY = Math.abs(this.velY) * 0.7;
                this.y = effectiveRadius + 1;
            } else {
                this.velY = Math.abs(this.velY);
                this.y = effectiveRadius + 1;
            }
            wallCollision = true;
            wallNormalX = 0;
            wallNormalY = 1;
        }

        if (wallCollision && !isGrazingWall) {
            this.applyWallDeformation(wallNormalX, wallNormalY, deformationSettings);
        }

        this.x += this.velX;
        this.y += this.velY;

        // Safety check: ensure balls stay within bounds considering deformation
        const minPos = effectiveRadius + 2;
        const maxPosX = canvasWidth - effectiveRadius - 2;
        const maxPosY = canvasHeight - effectiveRadius - 2;

        if (this.x < minPos) {
            this.x = minPos;
            this.velX = Math.abs(this.velX);
        } else if (this.x > maxPosX) {
            this.x = maxPosX;
            this.velX = -Math.abs(this.velX);
        }

        if (this.y < minPos) {
            this.y = minPos;
            this.velY = Math.abs(this.velY);
        } else if (this.y > maxPosY) {
            this.y = maxPosY;
            this.velY = -Math.abs(this.velY);
        }

        // Check if the ball should be put to sleep
        if (Math.abs(this.velX) < 0.1 && Math.abs(this.velY) < 0.1 && this.y > canvasHeight - this.size - 5) {
            this.isSleeping = true;
        }
    }
}

// Handles the collision response between two balls.
// This function applies positional correction, resolves velocities based on elastic collision physics,
// applies deformation effects, updates health, and increments the global score.
export function handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore) {
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

    // 5. Scoring: Increment global score for every collision
    if (setGlobalScore) {
        setGlobalScore(prevScore => prevScore + 1);
    }
}

// Iteratively solves collisions between all balls in the simulation.
// This function performs multiple iterations to ensure stable collision resolution,
// especially for stacked or multi-ball collisions.
export function solveCollisions(balls, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore) {
    const iterations = 5; // Number of iterations for stable collision resolution
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];

                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const combinedRadius = ball1.size + ball2.size;

                // Check for collision
                if (distance < combinedRadius) {
                    const overlap = combinedRadius - distance;
                    const normalX = dx / distance;
                    const normalY = dy / distance;

                    // Separate the balls to prevent overlap
                    ball1.x -= normalX * overlap / 2;
                    ball1.y -= normalY * overlap / 2;
                    ball2.x += normalX * overlap / 2;
                    ball2.y += normalY * overlap / 2;

                    // Wake up sleeping balls if they collide
                    if (ball1.isSleeping) ball1.isSleeping = false;
                    if (ball2.isSleeping) ball2.isSleeping = false;

                    const relativeVelX = ball2.velX - ball1.velX;
                    const relativeVelY = ball2.velY - ball1.velY;
                    const relativeSpeed = Math.sqrt(relativeVelX * relativeVelX + relativeVelY * relativeVelY);

                    // Apply collision response based on relative speed
                    if (relativeSpeed > 1) {
                        // Dynamic collision response for high-speed collisions
                        handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY, healthSystemEnabled, healthDamageMultiplier, deformationSettings, setGlobalScore);
                    } else {
                        // Iterative solver for low-speed collisions (stacking) with friction
                        const tangentX = -normalY;
                        const tangentY = normalX;
                        const tangentSpeed = relativeVelX * tangentX + relativeVelY * tangentY;
                        const friction = Math.min(0.1 * relativeSpeed, 0.1); // Apply dynamic friction
                        const frictionImpulse = tangentSpeed * friction;
                        ball1.velX += tangentX * frictionImpulse;
                        ball1.velY += tangentY * frictionImpulse;
                        ball2.velX -= tangentX * frictionImpulse;
                        ball2.velY -= tangentY * frictionImpulse;
                    }
                }
            }
        }
    }
}

export function initializeBalls(balls, ballCount, ballSize, ballVelocity, canvasWidth, canvasHeight) {
    while(balls.length < ballCount) {
        const size = random(ballSize - 20, ballSize + 20);
        const ball = new Ball(
            random(0 + size, canvasWidth - size),
            random(0 + size, canvasHeight - size),
            random(-ballVelocity, ballVelocity),
            random(-ballVelocity, ballVelocity),
            'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
            size
        );
        ball._lastMultiplier = 1;
        balls.push(ball);
    }
}

export function addNewBall(balls, ballSize, ballVelocity, canvasWidth, canvasHeight, x = null, y = null, ballShape = DEFAULTS.ballShape) {
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
        shapeToUse
    );
    ball._lastMultiplier = 1;
    balls.push(ball);
}

export function adjustBallCount(balls, targetCount, ballSize, ballVelocity, canvasWidth, canvasHeight) {
    while (balls.length < targetCount) {
        addNewBall(balls, ballSize, ballVelocity, canvasWidth, canvasHeight);
    }
    while (balls.length > targetCount && balls.length > 0) {
        balls.pop();
    }
}

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

export function loop(ctx, balls, canvasWidth, canvasHeight, physicsSettings, currentBackgroundColor, currentClearAlpha, setGlobalScore, tempCtx) {
    // Clear canvas with trail effect
    tempCtx.fillStyle = currentBackgroundColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const imageData = tempCtx.getImageData(0, 0, 1, 1).data;
    
    ctx.fillStyle = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentClearAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];

        if (ball.isSleeping) {
            ball.draw(ctx);
            continue;
        }

        ball.draw(ctx);
        ball.update(canvasWidth, canvasHeight, physicsSettings.enableGravity ? physicsSettings.gravityStrength : 0, physicsSettings.ballVelocity, physicsSettings.deformation);
    }

    solveCollisions(balls, physicsSettings.gameplay.healthSystem, physicsSettings.gameplay.healthDamageMultiplier, physicsSettings.deformation, setGlobalScore);
}