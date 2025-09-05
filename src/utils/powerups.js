import { resolveLevelPos } from './levelPositioning.js';
import { drawPowerup } from './canvasRendering.js';
import Sound from './sound.js';

export function resolvePowerups(level, canvasWidth, canvasHeight) {
  const out = [];
  if (!level || !level.powerups) return out;
  for (let i = 0; i < level.powerups.length; i++) {
    const pu = level.powerups[i];
    const p = resolveLevelPos(pu, canvasWidth, canvasHeight);
    out.push({ ...pu, x: p.x, y: p.y });
  }
  return out;
}

export function drawPowerups(ctx, resolvedPowerups) {
  if (!resolvedPowerups || !resolvedPowerups.length) return;
  for (let i = 0; i < resolvedPowerups.length; i++) {
    drawPowerup(ctx, resolvedPowerups[i]);
  }
}

// Mutates level.powerups when picked up. Player is either selectedBall or starting ball.
export function applyPowerupPickups(level, balls, resolvedPowerups, selectedBall) {
  if (!level || !level.powerups || !resolvedPowerups) return;
  const now = Date.now();
  const player = (selectedBall && balls.find(b => b.id === selectedBall.id)) || balls.find(b => b.isStartingBall);
  if (!player) return;
  for (let i = level.powerups.length - 1; i >= 0; i--) {
    const pu = level.powerups[i];
    const p = resolvedPowerups[i];
    if (!p || pu.shape !== 'circle') continue; // support circles only
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    const thresh = player.size + pu.radius;
    if ((dx*dx + dy*dy) <= (thresh * thresh)) {
      if (pu.type === 'shield') {
        player.shieldUntil = now + 8000;
        Sound.playPowerup('shield');
      } else if (pu.type === 'speed') {
        player.speedUntil = now + 6000;
        Sound.playPowerup('speed');
      } else if (pu.type === 'shrink') {
        player.baseSize = player.baseSize || player.size;
        player.size = Math.max(6, Math.round(player.baseSize * 0.65));
        player.shrinkUntil = now + 7000;
        Sound.playPowerup('shrink');
      } else if (pu.type === 'expire') {
        Sound.playPowerup('expire');
      } else {
        Sound.playPowerup('unknown');
      }
      level.powerups.splice(i, 1);
    }
  }
}
