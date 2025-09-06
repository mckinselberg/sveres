import { useCallback, useMemo } from 'react';
import { initializeBalls, addNewBall } from '../utils/physics.jsx';

// Provides stable imperative methods for Canvas's ref API
export default function useImperativeCanvasAPI({
  canvasRef,
  ballsRef,
  selectedBallIdRef,
  loseRef,
  level,
  ballCount,
  ballSize,
  ballVelocity,
  ballShape,
  newBallSize,
  onSelectedBallChangeRef,
  emitSnapshot,
  gameLoop,
  jump,
}) {
  const addBall = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    addNewBall(
      ballsRef.current,
      newBallSize ?? ballSize,
      ballVelocity,
      canvas.width,
      canvas.height,
      null,
      null,
      ballShape
    );
    emitSnapshot();
  }, [canvasRef, ballsRef, newBallSize, ballSize, ballVelocity, ballShape, emitSnapshot]);

  const removeBall = useCallback(() => {
    if (ballsRef.current.length > 0) ballsRef.current.pop();
    emitSnapshot();
  }, [ballsRef, emitSnapshot]);

  const resetBalls = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Stop loop first to avoid rendering while mutating ball state
    gameLoop.stop();
    ballsRef.current = [];
    loseRef.current = false;
    const startingOverrideReset = level ? 15 : undefined;
    initializeBalls(
      ballsRef.current,
      ballCount,
      ballSize,
      ballVelocity,
      canvas.width,
      canvas.height,
      ballShape,
      startingOverrideReset
    );
    if (level && ballsRef.current.length > 0) {
      ballsRef.current[0].size = 15;
      ballsRef.current[0].originalSize = 15;
      // Seed jump state
      ballsRef.current[0]._airJumpAvailable = true;
    }
    if (level && ballsRef.current.length > 0) {
      selectedBallIdRef.current = ballsRef.current[0].id;
      if (onSelectedBallChangeRef.current)
        onSelectedBallChangeRef.current({ ...ballsRef.current[0] });
    } else {
      selectedBallIdRef.current = null;
      if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current(null);
    }
  emitSnapshot();
  // Restart the game loop cleanly after reseed
    gameLoop.restart();
  }, [
    canvasRef,
    ballsRef,
    loseRef,
    level,
    ballCount,
    ballSize,
    ballVelocity,
    ballShape,
    onSelectedBallChangeRef,
    selectedBallIdRef,
    emitSnapshot,
    gameLoop,
  ]);

  const applyColorScheme = useCallback(
    (scheme) => {
      ballsRef.current.forEach((ball, index) => {
        if (scheme.ballColors && scheme.ballColors[index]) {
          ball.color = scheme.ballColors[index];
          ball.originalColor = scheme.ballColors[index];
        }
      });
      emitSnapshot();
    },
    [ballsRef, emitSnapshot]
  );

  const updateSelectedBall = useCallback(
    (updated) => {
      const id = updated.id ?? selectedBallIdRef.current;
      if (id == null) return;
      const ball = ballsRef.current.find((b) => b.id === id);
      if (!ball) return;
      // Mutate fields in place to keep engine references
      // Only allow explicit position overrides when requested
      if (updated.__allowXY === true) {
        if (typeof updated.x === 'number') ball.x = updated.x;
        if (typeof updated.y === 'number') ball.y = updated.y;
      }
      if (typeof updated.velX === 'number') ball.velX = updated.velX;
      if (typeof updated.velY === 'number') ball.velY = updated.velY;
      if (typeof updated.color === 'string') ball.color = updated.color;
      if (typeof updated.size === 'number') ball.size = updated.size;
      if (typeof updated.shape === 'string') ball.shape = updated.shape;
      if (typeof updated.isStatic === 'boolean') ball.isStatic = updated.isStatic;
      if (typeof updated.health === 'number') ball.health = updated.health;
      if (typeof updated.opacity === 'number') ball.opacity = updated.opacity;
      if (typeof updated.controlTuning === 'object')
        ball.controlTuning = { ...(ball.controlTuning || {}), ...updated.controlTuning };
      if (updated._lastMultiplier != null) ball._lastMultiplier = updated._lastMultiplier;
      if (updated.originalSize != null) ball.originalSize = updated.originalSize;

      // If velocity is being driven by input, wake the ball so movement applies even from sleep/zero
      if (typeof updated.velX === 'number' || typeof updated.velY === 'number') {
        const speed = Math.hypot(ball.velX || 0, ball.velY || 0);
        if (speed > 0.01) {
          ball.isSleeping = false;
        }
      }
      if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current({ ...ball });
      emitSnapshot();
    },
    [ballsRef, selectedBallIdRef, onSelectedBallChangeRef, emitSnapshot]
  );

  const jumpPlayer = useCallback(() => {
    jump();
  }, [jump]);

  // Stable object identity for useImperativeHandle
  return useMemo(
    () => ({ addBall, removeBall, resetBalls, applyColorScheme, updateSelectedBall, jumpPlayer }),
    [addBall, removeBall, resetBalls, applyColorScheme, updateSelectedBall, jumpPlayer]
  );
}
