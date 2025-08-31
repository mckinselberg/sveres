import { gsap } from 'gsap';
import { getControlsPanel } from './dom.js';

let __BALL_ID_SEQ = 1;

export type ShapeName = 'circle'|'square'|'triangle'|'diamond'|'pentagon'|'hexagon'|'octagon'|'star';

export interface DeformationSettings {
  enabled: boolean;
  intensity: number;
  speed: number;
  ease: string;
  easeOverride?: string;
}

export class Ball {
  id: number;
  x: number;
  y: number;
  velX: number;
  velY: number;
  color: string;
  originalColor?: string;
  size: number;
  shape: ShapeName;
  isStatic: boolean;
  scaleX: number = 1;
  scaleY: number = 1;
  deformAngle: number = 0;
  isAnimating: boolean = false;
  lastAnimationTime: number = 0;
  lastCollisionTime: number = 0;
  collisionCount: number = 0;
  health: number = 100;
  isSleeping: boolean = false;
  isStartingBall?: boolean;
  _lastMultiplier?: number;

  constructor(x: number, y: number, velX: number, velY: number, color: string, size: number, shape: ShapeName = 'circle', isStatic: boolean = false) {
    this.id = __BALL_ID_SEQ++;
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.color = color;
    this.size = size;
    this.shape = shape;
    this.isStatic = isStatic;
  }

  draw(ctx: CanvasRenderingContext2D, selectedBall: Ball | null) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.deformAngle);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.rotate(-this.deformAngle);

    ctx.beginPath();
    ctx.fillStyle = this.color;

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

    if (this.health < 100) {
      const healthBarWidth = this.size * 2;
      const healthBarHeight = 5;
      const healthPercentage = this.health / 100;

      ctx.fillStyle = 'red';
      ctx.fillRect(-this.size, this.size + 5, healthBarWidth, healthBarHeight);
      ctx.fillStyle = 'green';
      ctx.fillRect(-this.size, this.size + 5, healthBarWidth * healthPercentage, healthBarHeight);
    }

    if (selectedBall && selectedBall === this) {
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if ((this as any).isStartingBall) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  applyWallDeformation(normalX: number, normalY: number, deformationSettings: DeformationSettings) {
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
        ease: 'power3.out'
      })
      .to(this, {
        scaleX: 1,
        scaleY: 1,
        duration: animationDuration * 5,
        ease: deformationEase as any
      });
  }

  applyBallDeformation(normalX: number, normalY: number, intensity: number, deformationSettings: DeformationSettings) {
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
        ease: 'power3.out'
      })
      .to(this, {
        scaleX: 1,
        scaleY: 1,
        duration: animationDuration * 5,
        ease: deformationEase as any
      });
  }

  update(canvasWidth: number, canvasHeight: number, gravityStrength: number, maxVelocity: number, deformationSettings: DeformationSettings) {
    if (gravityStrength > 0) {
      this.velY += gravityStrength;
    }

    const controlsPanel = getControlsPanel();
    if (controlsPanel) {
      const panelRect = controlsPanel.getBoundingClientRect();
      let closestX = Math.max(panelRect.left, Math.min(this.x, panelRect.right));
      let closestY = Math.max(panelRect.top, Math.min(this.y, panelRect.bottom));
      const dx = this.x - (closestX as number);
      const dy = this.y - (closestY as number);
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

    if (Math.abs(this.velX) < 0.1 && Math.abs(this.velY) < 0.1 && this.y > canvasHeight - this.size - 5) {
      this.isSleeping = true;
    }
  }
}
