import { useRef, useEffect, memo, forwardRef, useImperativeHandle, useCallback } from 'react';
// Use the JS physics module (with sound hooks) explicitly
import { initializeBalls, addNewBall, adjustBallCount, adjustBallVelocities } from '../utils/physics.jsx';
import Sound from '../utils/sound';
import useResolvedStatics from '../hooks/useResolvedStatics.js';
import useGameLoop from '../hooks/useGameLoop.js';
import useCanvasSize from '../hooks/useCanvasSize.js';

const Canvas = memo(forwardRef(function Canvas({
    enableGravity,
    gravityStrength,
    ballVelocity,
    deformation,
    gameplay,
    backgroundColor,
    trailOpacity,
    setGlobalScore,
    selectedBall: _selectedBall, // snapshot from App for display only (unused here)
    onSelectedBallChange, // callback(ball|null)
    onBallsSnapshot, // callback(balls[])
    isPaused,
    level,
    setScoredBallsCount,
    setRemovedBallsCount,
    ballCount,
    ballSize,
    ballShape,
    newBallSize,
    onWin,
    onLose,
    onSelectedBallMotion
}, ref) {
    const canvasRef = useRef(null);
    const ballsRef = useRef([]);
    const selectedBallIdRef = useRef(null);
    const prevSettingsRef = useRef({ ballCount, ballSize, ballVelocity, ballShape });
    const settingsRef = useRef({ enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity });
    const onSelectedBallChangeRef = useRef(onSelectedBallChange);
    const onSelectedBallMotionRef = useRef(onSelectedBallMotion);
    const loseRef = useRef(false);
    // (moved into useGameLoop)
    const viewport = useCanvasSize();

    // Keep latest callback refs to avoid re-running effects due to unstable identities
    useEffect(() => {
        onSelectedBallChangeRef.current = onSelectedBallChange;
    }, [onSelectedBallChange]);
    useEffect(() => {
        onSelectedBallMotionRef.current = onSelectedBallMotion;
    }, [onSelectedBallMotion]);

    // Keep latest settings in a ref so the render loop reads fresh values without restarting effects
    useEffect(() => {
        settingsRef.current = { enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity };
    }, [enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity]);

    // Pre-resolve hazards/goals for the current level and viewport and start the RAF loop
    const { resolvedHazards, resolvedGoals, preResolvedStatics } = useResolvedStatics(level, viewport.w, viewport.h);
    const gameLoop = useGameLoop({
        canvasRef,
        ballsRef,
        selectedBallIdRef,
        settingsRef,
        isPaused,
        level,
        memo: { resolvedHazards, resolvedGoals, preResolvedStatics },
        setGlobalScore,
        setScoredBallsCount,
        setRemovedBallsCount,
        onWin,
        onLose,
        onSelectedBallChangeRef,
        onSelectedBallMotionRef,
        viewW: viewport.w,
        viewH: viewport.h
    });

    // Imperative API for App/Controls
    const emitSnapshot = useCallback(() => {
        if (!onBallsSnapshot) return;
        const snap = ballsRef.current.map(b => ({
            id: b.id,
            x: b.x,
            y: b.y,
            velX: b.velX,
            velY: b.velY,
            color: b.color,
            originalColor: b.originalColor,
            size: b.size,
            shape: b.shape,
            opacity: b.opacity,
            controlTuning: b.controlTuning,
            isStatic: b.isStatic,
            health: b.health
        }));
        onBallsSnapshot(snap);
    }, [onBallsSnapshot]);

    useImperativeHandle(ref, () => ({
        addBall: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            addNewBall(ballsRef.current, newBallSize ?? ballSize, ballVelocity, canvas.width, canvas.height, null, null, ballShape);
            emitSnapshot();
        },
        removeBall: () => {
            if (ballsRef.current.length > 0) ballsRef.current.pop();
            emitSnapshot();
        },
        resetBalls: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            ballsRef.current = [];
            loseRef.current = false;
            const startingOverrideReset = (level ? 15 : undefined);
            initializeBalls(ballsRef.current, ballCount, ballSize, ballVelocity, canvas.width, canvas.height, ballShape, startingOverrideReset);
            if (level && ballsRef.current.length > 0) {
                ballsRef.current[0].size = 15;
                ballsRef.current[0].originalSize = 15;
                // Seed jump state
                ballsRef.current[0]._airJumpAvailable = true;
            }
            if (level && ballsRef.current.length > 0) {
                selectedBallIdRef.current = ballsRef.current[0].id;
                if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current({ ...ballsRef.current[0] });
            } else {
                selectedBallIdRef.current = null;
                if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current(null);
            }
            emitSnapshot();
            // Restart the game loop if it was stopped after a win/lose
            gameLoop.stop();
            gameLoop.restart();
        },
        applyColorScheme: (scheme) => {
            // Update ball colors
            ballsRef.current.forEach((ball, index) => {
                if (scheme.ballColors && scheme.ballColors[index]) {
                    ball.color = scheme.ballColors[index];
                    ball.originalColor = scheme.ballColors[index];
                }
            });
            emitSnapshot();
        },
        updateSelectedBall: (updated) => {
            const id = updated.id ?? selectedBallIdRef.current;
            if (id == null) return;
            const ball = ballsRef.current.find(b => b.id === id);
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
            if (typeof updated.controlTuning === 'object') ball.controlTuning = { ...(ball.controlTuning || {}), ...updated.controlTuning };
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
        jumpPlayer: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            // Choose player: selected or starting ball in gauntlet
            const selected = selectedBallIdRef.current ? ballsRef.current.find(b => b.id === selectedBallIdRef.current) : null;
            let player = selected || ballsRef.current.find(b => b.isStartingBall);
            if (!player) return;
            const now = Date.now();
            const effR = player.size * Math.max(player.scaleX || 1, player.scaleY || 1);
            const grounded = (player.y + effR) >= ((viewport.h || canvas.height) - 3);
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
            // Cooldown: enforce for ground jumps; allow a short cooldown for the air jump so double-jump can happen immediately after takeoff
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
        }
    }), [ballCount, ballSize, ballVelocity, ballShape, newBallSize, level, viewport.h, emitSnapshot, gameLoop]);

    // Seed balls on mount and when level type or shape changes only
    useEffect(() => {
    // Initialize WebAudio on first user gesture
    Sound.init();
        const canvas = canvasRef.current;

    // apply viewport size to canvas respecting devicePixelRatio
    const cssW = viewport.w || window.innerWidth;
    const cssH = viewport.h || window.innerHeight;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx2d = canvas.getContext('2d');
    if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    // (Re)seed balls for new level/shape
    ballsRef.current = [];
    const startingOverrideSeed = (level ? 15 : undefined);
    initializeBalls(ballsRef.current, ballCount, ballSize, settingsRef.current.ballVelocity, canvas.width, canvas.height, ballShape, startingOverrideSeed);
    if (level && ballsRef.current.length > 0) {
        ballsRef.current[0].size = 15;
        ballsRef.current[0].originalSize = 15;
    // Seed jump state on level start
    ballsRef.current[0]._airJumpAvailable = true;
    }
        if (level && ballsRef.current.length > 0) {
            selectedBallIdRef.current = ballsRef.current[0].id;
            if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current({ ...ballsRef.current[0] });
        } else {
            selectedBallIdRef.current = null;
            if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current(null);
        }
        emitSnapshot();

        const handleMouseDown = (e) => {
            // In any level mode (game), keep the player (starting ball) selected
            if (level) {
                const player = ballsRef.current.find(b => b.isStartingBall) || (selectedBallIdRef.current && ballsRef.current.find(b => b.id === selectedBallIdRef.current));
                if (player) {
                    if (selectedBallIdRef.current !== player.id) {
                        selectedBallIdRef.current = player.id;
                        if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current({ ...player });
                    }
                }
                // Ignore canvas clicks for selection changes in level mode
                return;
            }
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            let ballClicked = false;
            for (let i = ballsRef.current.length - 1; i >= 0; i--) {
                const ball = ballsRef.current[i];
                const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
                if (distance < ball.size) {
                    selectedBallIdRef.current = ball.id;
                    if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current({ ...ball });
                    ballClicked = true;
                    break;
                }
            }

            if (!ballClicked && selectedBallIdRef.current != null) {
                selectedBallIdRef.current = null;
                if (onSelectedBallChangeRef.current) onSelectedBallChangeRef.current(null);
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);

        // Prevent zoom gestures on the canvas (mobile)
        canvas.addEventListener('gesturestart', (e) => e.preventDefault());
        canvas.addEventListener('gesturechange', (e) => e.preventDefault());
        canvas.addEventListener('gestureend', (e) => e.preventDefault());
        canvas.addEventListener('touchstart', function(e) {
            if (e.touches && e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchmove', function(e) {
            if (e.touches && e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        // Prevent double-tap to zoom
        let _lastTouchEnd = 0;
        canvas.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - _lastTouchEnd <= 300) e.preventDefault();
            _lastTouchEnd = now;
        }, { passive: false });

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level?.type, ballShape]);

    // (game loop initialized above)

    // Reconcile when count/size/velocity change (without full re-seed)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const prev = prevSettingsRef.current;
        if (ballCount !== prev.ballCount) {
            adjustBallCount(ballsRef.current, ballCount, ballSize, ballVelocity, canvas.width, canvas.height);
            emitSnapshot();
        }
        if (ballVelocity !== prev.ballVelocity) {
            adjustBallVelocities(ballsRef.current, ballVelocity);
        }
        if (ballSize !== prev.ballSize) {
            const ratio = ballSize / (prev.ballSize || ballSize);
            ballsRef.current.forEach(ball => {
                ball.size *= ratio;
                ball.originalSize = (ball.originalSize ?? ball.size) * ratio;
            });
            emitSnapshot();
        }
        prevSettingsRef.current = { ballCount, ballSize, ballVelocity, ballShape };
    }, [ballCount, ballSize, ballVelocity, ballShape, emitSnapshot]);

    return (
        <canvas
            ref={canvasRef}
            tabIndex={0}
            onMouseDown={() => {
                try { canvasRef.current && canvasRef.current.focus && canvasRef.current.focus(); } catch {}
            }}
            style={{ display: 'block' }}
        />
    );
}));

export default Canvas;