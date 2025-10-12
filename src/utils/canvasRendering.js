// Pure canvas rendering helpers used by the physics loop.
// No side effects; callers own ctx state except where noted.

/**
 * Draw a filled circle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} fillStyle
 */
export function drawCircle(ctx, x, y, r, fillStyle) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a filled rectangle centered at x,y with width/height.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} fillStyle
 */
export function drawRect(ctx, x, y, w, h, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

/**
 * Draw a static level shape (hazard/goal) using its shape data.
 * Supports: circle, square. Extend for more shapes as needed.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{shape:string,x:number,y:number,color:string,radius?:number,width?:number,height?:number}} shapeData
 */
export function drawStaticShape(ctx, shapeData) {
  ctx.save();
  ctx.fillStyle = shapeData.color;
  ctx.beginPath();

  if (shapeData.shape === 'circle') {
    ctx.arc(shapeData.x, shapeData.y, shapeData.radius, 0, 2 * Math.PI);
    ctx.fill();
  } else if (shapeData.shape === 'square') {
    const w = shapeData.width;
    const h = shapeData.height;
    ctx.fillRect(shapeData.x - w / 2, shapeData.y - h / 2, w, h);
  } else {
    // Fallback: do nothing for unsupported shapes for now
  }
  ctx.restore();
}

/**
 * Draw a powerup affordance with type-specific icons.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{type:string,shape:string,x:number,y:number,color?:string,radius?:number}} pu
 */
export function drawPowerup(ctx, pu) {
  ctx.save();
  
  const x = pu.x;
  const y = pu.y;
  const radius = pu.radius || 14;
  const color = pu.color || 'gold';
  
  // Draw outer ring
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw background circle
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw type-specific icon
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  
  const iconSize = radius * 0.6;
  
  switch (pu.type) {
    case 'health':
      // Medical cross (hospital icon)
      ctx.beginPath();
      // Vertical bar
      ctx.fillRect(x - iconSize * 0.15, y - iconSize * 0.6, iconSize * 0.3, iconSize * 1.2);
      // Horizontal bar
      ctx.fillRect(x - iconSize * 0.6, y - iconSize * 0.15, iconSize * 1.2, iconSize * 0.3);
      break;
      
    case 'speed':
      // Lightning bolt / speed lines
      ctx.beginPath();
      ctx.moveTo(x - iconSize * 0.4, y - iconSize * 0.6);
      ctx.lineTo(x + iconSize * 0.2, y - iconSize * 0.1);
      ctx.lineTo(x - iconSize * 0.1, y - iconSize * 0.1);
      ctx.lineTo(x + iconSize * 0.4, y + iconSize * 0.6);
      ctx.lineTo(x - iconSize * 0.2, y + iconSize * 0.1);
      ctx.lineTo(x + iconSize * 0.1, y + iconSize * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'shield':
      // Shield shape
      ctx.beginPath();
      ctx.moveTo(x, y - iconSize * 0.6);
      ctx.quadraticCurveTo(x + iconSize * 0.4, y - iconSize * 0.3, x + iconSize * 0.4, y + iconSize * 0.1);
      ctx.quadraticCurveTo(x + iconSize * 0.4, y + iconSize * 0.4, x, y + iconSize * 0.6);
      ctx.quadraticCurveTo(x - iconSize * 0.4, y + iconSize * 0.4, x - iconSize * 0.4, y + iconSize * 0.1);
      ctx.quadraticCurveTo(x - iconSize * 0.4, y - iconSize * 0.3, x, y - iconSize * 0.6);
      ctx.fill();
      break;
      
    case 'shrink':
      // Inward arrows (shrinking symbol)
      ctx.beginPath();
      // Top arrow pointing down
      ctx.moveTo(x - iconSize * 0.3, y - iconSize * 0.6);
      ctx.lineTo(x, y - iconSize * 0.2);
      ctx.lineTo(x + iconSize * 0.3, y - iconSize * 0.6);
      ctx.moveTo(x, y - iconSize * 0.5);
      ctx.lineTo(x, y - iconSize * 0.1);
      
      // Bottom arrow pointing up  
      ctx.moveTo(x - iconSize * 0.3, y + iconSize * 0.6);
      ctx.lineTo(x, y + iconSize * 0.2);
      ctx.lineTo(x + iconSize * 0.3, y + iconSize * 0.6);
      ctx.moveTo(x, y + iconSize * 0.5);
      ctx.lineTo(x, y + iconSize * 0.1);
      
      // Left arrow pointing right
      ctx.moveTo(x - iconSize * 0.6, y - iconSize * 0.3);
      ctx.lineTo(x - iconSize * 0.2, y);
      ctx.lineTo(x - iconSize * 0.6, y + iconSize * 0.3);
      ctx.moveTo(x - iconSize * 0.5, y);
      ctx.lineTo(x - iconSize * 0.1, y);
      
      // Right arrow pointing left
      ctx.moveTo(x + iconSize * 0.6, y - iconSize * 0.3);
      ctx.lineTo(x + iconSize * 0.2, y);
      ctx.lineTo(x + iconSize * 0.6, y + iconSize * 0.3);
      ctx.moveTo(x + iconSize * 0.5, y);
      ctx.lineTo(x + iconSize * 0.1, y);
      
      ctx.stroke();
      break;
      
    default:
      // Fallback: simple dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, iconSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
}
