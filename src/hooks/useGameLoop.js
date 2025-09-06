import { useEffect, useRef, useCallback } from 'react';
import { loop as physicsLoop } from '../utils/physics.jsx';
import Sound from '../utils/sound.js';

// Encapsulates the RAF-driven game loop and post-physics bookkeeping.
// Returns restart/stop controls.
export default function useGameLoop({
  canvasRef,
  ballsRef,
  selectedBallIdRef,
  settingsRef,
  isPaused,
  level,
  memo, // { resolvedHazards, resolvedGoals, preResolvedStatics }
  setGlobalScore,
  setScoredBallsCount,
  setRemovedBallsCount,
  onWin,
  onLose,
  onSelectedBallChangeRef,
  onSelectedBallMotionRef,
  viewW,
  viewH
}) {
  const animationFrameId = useRef(null);
  const runningRef = useRef(false);
  const loseRef = useRef(false);
  const scoreDeltaRef = useRef(0);
  const scoredBallsDeltaRef = useRef(0);
  const removedBallsDeltaRef = useRef(0);
  const lastPowerupsRef = useRef({ shieldUntil: 0, speedUntil: 0, shrinkUntil: 0 });
  const memoRef = useRef(memo);

  // Keep latest memo without forcing loop restarts on identity changes
  useEffect(() => {
    memoRef.current = memo;
  }, [memo]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const restart = useCallback(() => {
    stop();
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas || isPaused) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (!runningRef.current) {
        animationFrameId.current = null;
        return;
      }

      const selectedForDraw = selectedBallIdRef.current
        ? ballsRef.current.find(b => b.id === selectedBallIdRef.current)
        : null;

      // reset deltas
      scoreDeltaRef.current = 0;
      scoredBallsDeltaRef.current = 0;
      removedBallsDeltaRef.current = 0;

      const incScore = () => { scoreDeltaRef.current += 1; };
      const incScored = () => { scoredBallsDeltaRef.current += 1; };
      const incRemoved = () => { removedBallsDeltaRef.current += 1; };

      // Always read latest settings each frame to reflect toggles after restart
      const s = settingsRef.current;
      const currentMemo = memoRef.current;

      physicsLoop(
        ctx,
        ballsRef.current,
        viewW || canvas.width,
        viewH || canvas.height,
        { enableGravity: s.enableGravity, gravityStrength: s.gravityStrength, ballVelocity: s.ballVelocity, deformation: s.deformation, gameplay: s.gameplay },
        s.backgroundColor,
        1 - (s.trailOpacity * 0.9),
        incScore,
        selectedForDraw,
        level,
        incScored,
        incRemoved,
        () => { loseRef.current = true; },
        currentMemo
      );

      // After physics step, if player is grounded, reset air-jump availability
      const playerBall = selectedForDraw || ballsRef.current.find(b => b.isStartingBall);
      if (playerBall) {
        const effR2 = playerBall.size * Math.max(playerBall.scaleX || 1, playerBall.scaleY || 1);
        const groundedNow = (playerBall.y + effR2) >= ((viewH || canvas.height) - 3);
        if (groundedNow) {
          playerBall._airJumpAvailable = true;
        }
      }

      // Fallback: detect goal overlap for the player (using current memo)
      if (!loseRef.current && currentMemo?.resolvedGoals && currentMemo.resolvedGoals.length) {
        const player = selectedForDraw || ballsRef.current.find(b => b.isStartingBall);
        if (player) {
          for (let k = 0; k < currentMemo.resolvedGoals.length; k++) {
            const g = currentMemo.resolvedGoals[k];
            if (g.shape === 'circle') {
              const dx = g.x - player.x;
              const dy = g.y - player.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const combined = player.size + (g.radius || 0);
              if (dist <= combined) {
                const now = Date.now();
                if (player.shieldUntil && player.shieldUntil > now) {
                  // consume shield and reflect a bit
                  player.shieldUntil = undefined;
                  const inv = dist === 0 ? 0 : 1 / dist;
                  const nx = dist === 0 ? 1 : dx * inv;
                  const ny = dist === 0 ? 0 : dy * inv;
                  const reflect = (player.velX * nx + player.velY * ny) * 2;
                  player.velX -= reflect * nx;
                  player.velY -= reflect * ny;
                  player.x -= nx * (combined - dist + 2);
                  player.y -= ny * (combined - dist + 2);
                } else {
                  loseRef.current = true;
                }
                break;
              }
            }
          }
        }
      }

      // Report selected ball motion
      if (selectedForDraw && onSelectedBallMotionRef?.current) {
        onSelectedBallMotionRef.current({ id: selectedForDraw.id, velX: selectedForDraw.velX });
      }

      // Push HUD powerup changes as a minimal update
      if (selectedForDraw && onSelectedBallChangeRef?.current) {
        const lp = lastPowerupsRef.current;
        const su = selectedForDraw.shieldUntil || 0;
        const pu = selectedForDraw.speedUntil || 0;
        const ku = selectedForDraw.shrinkUntil || 0;
        if (su !== lp.shieldUntil || pu !== lp.speedUntil || ku !== lp.shrinkUntil) {
          lastPowerupsRef.current = { shieldUntil: su, speedUntil: pu, shrinkUntil: ku };
          onSelectedBallChangeRef.current({ id: selectedForDraw.id, shieldUntil: su, speedUntil: pu, shrinkUntil: ku });
        }
      }

      // Flush accumulated increments
      if (scoreDeltaRef.current) setGlobalScore?.(prev => prev + scoreDeltaRef.current);
      if (scoredBallsDeltaRef.current) setScoredBallsCount?.(prev => prev + scoredBallsDeltaRef.current);
      if (removedBallsDeltaRef.current) setRemovedBallsCount?.(prev => prev + removedBallsDeltaRef.current);

      // Resolve lose/win and schedule next frame
      if (loseRef.current) {
        loseRef.current = false;
        Sound.playLose();
        onLose?.();
        animationFrameId.current = null;
        return; // stop loop
      }

      if (level && level.type === 'gravityGauntlet') {
        const nonPlayer = ballsRef.current.filter(b => !b.isStartingBall);
        if (nonPlayer.length === 0) {
          Sound.playWin();
          onWin?.();
          animationFrameId.current = null;
          return; // stop loop
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();
  }, [canvasRef, isPaused, settingsRef, ballsRef, selectedBallIdRef, level, onLose, onWin, setGlobalScore, setScoredBallsCount, setRemovedBallsCount, onSelectedBallChangeRef, onSelectedBallMotionRef, viewW, viewH, stop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isPaused) {
      stop();
      return;
    }
    restart();
    return () => stop();
  }, [canvasRef, isPaused, level, restart, stop]);

  return { restart, stop };
}
