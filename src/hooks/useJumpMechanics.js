import { useCallback } from 'react';

// Encapsulates jump logic (ground/air jump token, cooldowns) using logical viewport height
export default function useJumpMechanics({ canvasRef, settingsRef, selectedBallIdRef, ballsRef, viewHeight }) {
  const jump = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Choose player: selected or starting ball in gauntlet
    const selectedId = selectedBallIdRef.current;
    const selected = selectedId ? ballsRef.current.find(b => b.id === selectedId) : null;
    let player = selected || ballsRef.current.find(b => b.isStartingBall);
    if (!player) return;

    const now = Date.now();
    const effR = player.size * Math.max(player.scaleX || 1, player.scaleY || 1);
    const logicalH = viewHeight || canvas.height; // viewHeight is CSS pixels; canvas.height fallback okay if DPR-transform is set
    const grounded = (player.y + effR) >= (logicalH - 3);

    // Decide jump type first, then apply cooldown rules
    let isAirJump = false;
    if (!grounded) {
      if (!player._airJumpAvailable) return; // no air jump available
      isAirJump = true;
      // consume token for air jump
      player._airJumpAvailable = false;
    } else {
      // grounded jump always resets token so another air jump is possible after takeoff
      player._airJumpAvailable = true;
    }

    // Cooldown: enforce for ground jumps; allow short cooldown for air jump so double-jump can happen immediately after takeoff
    if (!isAirJump) {
      if (player._jumpCooldownUntil && player._jumpCooldownUntil > now) return;
    }

    const s = settingsRef.current;
    const g = Math.max(0.05, s.gravityStrength || 0.15);
    // Jump velocity scaled by gravity for natural feel
    const jumpVy = -Math.max(8, Math.min(18, g * 70));
    player.velY = jumpVy;
    player.isSleeping = false;
    player._jumpCooldownUntil = now + (isAirJump ? 140 : 280); // ms
  }, [canvasRef, settingsRef, selectedBallIdRef, ballsRef, viewHeight]);

  return { jump };
}
