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
 * Draw a powerup affordance (currently only circle type used in the app).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{shape:string,x:number,y:number,color?:string,radius?:number}} pu
 */
export function drawPowerup(ctx, pu) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = pu.color || 'gold';
  ctx.lineWidth = 3;
  if (pu.shape === 'circle') {
    ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.arc(pu.x, pu.y, Math.max(2, pu.radius * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
