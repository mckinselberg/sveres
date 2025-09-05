// Resolve level object positions with flexible expressions.
// Supports numbers (px), percentages '50%', center/middle with +/- offsets,
// and edge-anchored positions like 'right-10%', 'left+20', 'bottom-24'.

function parseOffset(str, max) {
  if (!str) return 0;
  const t = String(str).trim();
  if (t.endsWith('%')) {
    const n = parseFloat(t);
    return Number.isFinite(n) ? (n / 100) * max : 0;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export function resolveLevelPos(obj, canvasWidth, canvasHeight) {
  const halfSizeX = (() => {
    if (obj?.shape === 'circle' && Number.isFinite(obj?.radius)) return obj.radius;
    if (Number.isFinite(obj?.width)) return obj.width / 2;
    return 0;
  })();
  const halfSizeY = (() => {
    if (obj?.shape === 'circle' && Number.isFinite(obj?.radius)) return obj.radius;
    if (Number.isFinite(obj?.height)) return obj.height / 2;
    return 0;
  })();

  const rx = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'center') return canvasWidth / 2;
      const centerMatch = s.match(/^center\s*([+-])\s*(\d+(?:\.\d+)?%?)?$/);
      if (centerMatch) {
        const sign = centerMatch[1] === '-' ? -1 : 1;
        const off = parseOffset(centerMatch[2], canvasWidth);
        return canvasWidth / 2 + sign * off;
      }
      const rightMatch = s.match(/^right(?:\s*([+-])\s*(\d+(?:\.\d+)?%?))?$/);
      if (rightMatch) {
        const sign = rightMatch[1] === '+' ? 1 : -1;
        const off = parseOffset(rightMatch[2], canvasWidth);
        return (canvasWidth - halfSizeX) + sign * off;
      }
      const leftMatch = s.match(/^left(?:\s*([+-])\s*(\d+(?:\.\d+)?%?))?$/);
      if (leftMatch) {
        const sign = leftMatch[1] === '-' ? -1 : 1;
        const off = parseOffset(leftMatch[2], canvasWidth);
        return halfSizeX + sign * off;
      }
      if (s.endsWith('%')) {
        const n = parseFloat(s);
        if (Number.isFinite(n)) return (n / 100) * canvasWidth;
      }
    }
    return Number(v) || 0;
  };

  const ry = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'center' || s === 'middle') return canvasHeight / 2;
      const centerMatch = s.match(/^(center|middle)\s*([+-])\s*(\d+(?:\.\d+)?%?)?$/);
      if (centerMatch) {
        const sign = centerMatch[2] === '-' ? -1 : 1;
        const off = parseOffset(centerMatch[3], canvasHeight);
        return canvasHeight / 2 + sign * off;
      }
      const bottomMatch = s.match(/^bottom(?:\s*([+-])\s*(\d+(?:\.\d+)?%?))?$/);
      if (bottomMatch) {
        const sign = bottomMatch[1] === '+' ? 1 : -1;
        const off = parseOffset(bottomMatch[2], canvasHeight);
        return (canvasHeight - halfSizeY) + sign * off;
      }
      const topMatch = s.match(/^top(?:\s*([+-])\s*(\d+(?:\.\d+)?%?))?$/);
      if (topMatch) {
        const sign = topMatch[1] === '-' ? -1 : 1;
        const off = parseOffset(topMatch[2], canvasHeight);
        return halfSizeY + sign * off;
      }
      if (s.endsWith('%')) {
        const n = parseFloat(s);
        if (Number.isFinite(n)) return (n / 100) * canvasHeight;
      }
    }
    return Number(v) || 0;
  };

  return { x: rx(obj.x), y: ry(obj.y) };
}
