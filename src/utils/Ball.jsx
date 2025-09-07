import { gsap } from 'gsap';
import { getControlsPanel } from './dom.js';

// Simple incremental ID generator for balls
let __BALL_ID_SEQ = 1;

/**
 * Represents a physics/visual entity in the simulation.
 * @typedef {Object} BallEntity
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {number} velX
 * @property {number} velY
 * @property {string} color
 * @property {string} [originalColor]
 * @property {number} size
 * @property {('circle'|'square'|'triangle'|'diamond'|'pentagon'|'hexagon'|'octagon'|'star')} shape
 * @property {boolean} isStatic
 * @property {number} scaleX
 * @property {number} scaleY
 * @property {number} deformAngle
 * @property {boolean} isAnimating
 * @property {number} lastAnimationTime
 * @property {number} lastCollisionTime
 * @property {number} collisionCount
 * @property {number} health
 * @property {boolean} isSleeping
 * @property {boolean} [isStartingBall]
 * @property {number} [_lastMultiplier]
 */

export class Ball {
     /**
      * @param {number} x
      * @param {number} y
      * @param {number} velX
      * @param {number} velY
      * @param {string} color
      * @param {number} size
      * @param {BallEntity['shape']} [shape]
      * @param {boolean} [isStatic]
      */
    constructor(x, y, velX, velY, color, size, shape = 'circle', isStatic = false) {
    this.id = __BALL_ID_SEQ++;
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.color = color;
        this.size = size;
        this.shape = shape;
        this.isStatic = isStatic;
        this.scaleX = 1;
        this.scaleY = 1;
        this.deformAngle = 0;
        this.isAnimating = false;
        this.lastAnimationTime = 0;
        this.lastCollisionTime = 0;
        this.collisionCount = 0;
        this.health = 100;
    this.isSleeping = false;
    this.opacity = 1;
    this.isDespawning = false;
    }

    draw(ctx, selectedBall) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.deformAngle);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.rotate(-this.deformAngle);

    const prevAlpha = ctx.globalAlpha;
    if (typeof this.opacity === 'number') ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));

        ctx.beginPath();
        ctx.fillStyle = this.color;

        // Draw the shape
        switch (this.shape) {
            case 'circle':
                ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
                break;
            case 'square':
                ctx.rect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;
            case 'triangle':
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.closePath();
                break;
            case 'diamond':
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(0, this.size);
                ctx.lineTo(-this.size, 0);
                ctx.closePath();
                break;
            case 'pentagon':
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 5), this.size * Math.sin(i * 2 * Math.PI / 5));
                }
                ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 6), this.size * Math.sin(i * 2 * Math.PI / 6));
                }
                ctx.closePath();
                break;
            case 'octagon':
                for (let i = 0; i < 8; i++) {
                    ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 8), this.size * Math.sin(i * 2 * Math.PI / 8));
                }
                ctx.closePath();
                break;
            case 'star':
                ctx.moveTo(0, -this.size);
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(this.size * Math.cos((i * 2 + 0.5) * Math.PI / 5), this.size * Math.sin((i * 2 + 0.5) * Math.PI / 5));
                    ctx.lineTo(this.size * 0.5 * Math.cos((i * 2 + 1.5) * Math.PI / 5), this.size * 0.5 * Math.sin((i * 2 + 1.5) * Math.PI / 5));
                }
                ctx.closePath();
                break;
            default:
                ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
        }

        ctx.fill();

        // Health indicator matched to parent shape outline
        if (this.health < 100) {
            const pct = Math.max(0, Math.min(1, this.health / 100));
            const lw = Math.max(3, Math.min(10, this.size * 0.14));
            const innerScale = 0.82;
            const healthColor = pct <= 0.2
                ? 'rgba(220,60,50,0.98)'
                : (pct <= 0.5
                    ? 'rgba(255,200,0,0.98)'
                    : 'rgba(0,200,70,0.95)');

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = lw;

            const drawTrackAndProgress = (pts, closed = true) => {
                let L = 0;
                for (let i = 0; i < pts.length; i++) {
                    const a = pts[i];
                    const b = pts[(i + 1) % pts.length];
                    L += Math.hypot(b.x - a.x, b.y - a.y);
                    if (!closed && i === pts.length - 2) break;
                }
                const p = new Path2D();
                p.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
                if (closed) p.closePath();
                ctx.setLineDash([]);
                ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                ctx.stroke(p);
                if (pct > 0) {
                    const dash = Math.max(0.0001, pct * L);
                    const gap = Math.max(0.0001, (1 - pct) * L);
                    ctx.setLineDash([dash, gap]);
                    ctx.lineDashOffset = 0;
                    ctx.strokeStyle = healthColor;
                    ctx.stroke(p);
                    ctx.setLineDash([]);
                    ctx.lineDashOffset = 0;
                }
            };

            if (this.shape === 'circle') {
                const radius = Math.max(4, this.size * innerScale);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
                if (pct > 0) {
                    const start = -Math.PI / 2;
                    const end = start + Math.PI * 2 * pct;
                    ctx.beginPath();
                    ctx.strokeStyle = healthColor;
                    ctx.arc(0, 0, radius, start, end);
                    ctx.stroke();
                }
            } else {
                const s = this.size * innerScale;
                let pts = [];
                const pushNSided = (n, offsetRad = -Math.PI/2) => {
                    for (let i = 0; i < n; i++) {
                        const a = offsetRad + i * 2 * Math.PI / n;
                        pts.push({ x: s * Math.cos(a), y: s * Math.sin(a) });
                    }
                };
                switch (this.shape) {
                    case 'square': pts = [ {x:-s,y:-s}, {x:s,y:-s}, {x:s,y:s}, {x:-s,y:s} ]; break;
                    case 'triangle': pushNSided(3); break;
                    case 'diamond': pts = [ {x:0,y:-s}, {x:s, y:0}, {x:0,y:s}, {x:-s,y:0} ]; break;
                    case 'pentagon': pushNSided(5); break;
                    case 'hexagon': pushNSided(6); break;
                    case 'octagon': pushNSided(8); break;
                    case 'star': {
                        const outer = s, inner = s * 0.5; pts = []; let a = -Math.PI/2;
                        for (let i = 0; i < 5; i++) { pts.push({ x: outer*Math.cos(a), y: outer*Math.sin(a) }); a += Math.PI/5; pts.push({ x: inner*Math.cos(a), y: inner*Math.sin(a) }); a += Math.PI/5; }
                        break;
                    }
                    default: pushNSided(6);
                }
                drawTrackAndProgress(pts, true);
            }
        }

        // Two indicator circles 23% above center, spaced 13% of diameter apart
        {
            const y = -this.size * 0.23;
            const sep = this.size * 0.74; // 37% of diameter (2*size)
            const r = Math.max(2, Math.min(8, this.size * 0.12));
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(-sep / 2, y, r, 0, Math.PI * 2);
            ctx.arc(sep / 2, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight selected ball
        if (selectedBall && selectedBall === this) {
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 4;
            ctx.stroke();
        } else if (this.isStartingBall) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

    ctx.restore();
    ctx.globalAlpha = prevAlpha;
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

        const controlsPanel = getControlsPanel();
        if (controlsPanel) {
            const panelRect = controlsPanel.getBoundingClientRect();
            let closestX = Math.max(panelRect.left, Math.min(this.x, panelRect.right));
            let closestY = Math.max(panelRect.top, Math.min(this.y, panelRect.bottom));
            const dx = this.x - closestX;
            const dy = this.y - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size) {
                const overlap = this.size - distance;
                let normalX = dx / distance;
                let normalY = dy / distance;

                if (isNaN(normalX) || isNaN(normalY)) {
                    normalX = 1;
                    normalY = 0;
                }

                this.x += normalX * overlap;
                this.y += normalY * overlap;

                const dotProduct = (this.velX * normalX + this.velY * normalY) * 2;
                this.velX -= dotProduct * normalX;
                this.velY -= dotProduct * normalY;

                this.applyWallDeformation(normalX, normalY, deformationSettings);
            }
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

    // Brief pop animation and then run onComplete to remove the ball from the sim
    popAndDespawn(onComplete, opts) {
                if (this.isDespawning) return;
                const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
                if (!isBrowser) { try { onComplete && onComplete(); } catch {} return; }
        this.isDespawning = true;
        this.isStatic = true;
        this.isSleeping = true;
        this.velX = 0; this.velY = 0;
                const dur = Math.max(120, Math.min(320, (opts?.durationMs ?? 200))) / 1000;
        if (typeof this.opacity !== 'number') this.opacity = 1;
        try {
            const tl = gsap.timeline({ onComplete: () => { try { onComplete && onComplete(); } catch {} } });
                        tl.to(this, { scaleX: 1.24, scaleY: 1.24, duration: dur * 0.48, ease: 'power2.out' })
                            .to(this, { opacity: 0, scaleX: 0.5, scaleY: 0.5, duration: dur * 0.52, ease: 'power2.in' }, '<');
        } catch (e) {
            const start = Date.now(); const total = dur * 1000; const end = start + total;
            const tick = () => { const now = Date.now(); const t = Math.max(0, Math.min(1, (now - start)/total)); this.opacity = 1 - t; if (now < end) { (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame(tick) : setTimeout(tick, 16); } else { onComplete && onComplete(); } };
            tick();
        }
    }
}