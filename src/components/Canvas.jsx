import { useRef, useEffect, memo, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
// Use the JS physics module (with sound hooks) explicitly
import { loop, initializeBalls, addNewBall, adjustBallCount, adjustBallVelocities } from '../utils/physics.jsx';
import Sound from '../utils/sound';

const Canvas = memo(forwardRef(function Canvas({
    enableGravity,
    gravityStrength,
    ballVelocity,
    deformation,
    gameplay,
    backgroundColor,
    trailOpacity,
    setGlobalScore,
    _selectedBall, // snapshot from App for display only (intentionally unused)
    onSelectedBallChange, // callback(ball|null)
    onBallsSnapshot, // callback(balls[])
    isPaused,
    level,
    setScoredBallsCount,
    setRemovedBallsCount,
    ballCount,
    ballSize,
    ballShape,
    applyShapeToExisting,
    newBallSize,
    onWin,
    onLose,
    onSelectedBallMotion
}, ref) {
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);
    const ballsRef = useRef([]);
    const selectedBallIdRef = useRef(null);
    const prevSettingsRef = useRef({ ballCount, ballSize, ballVelocity, ballShape });
    const lastAppliedShapeRef = useRef(ballShape);
    const settingsRef = useRef({ enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity });
    const onSelectedBallChangeRef = useRef(onSelectedBallChange);
    const onSelectedBallMotionRef = useRef(onSelectedBallMotion);
    const onWinRef = useRef(onWin);
    const onLoseRef = useRef(onLose);
    const loseRef = useRef(false);
    const [forceTick, setForceTick] = useState(0);
    // Frame-batched increments to reduce React updates inside RAF
    const scoreDeltaRef = useRef(0);
    const scoredBallsDeltaRef = useRef(0);
    const removedBallsDeltaRef = useRef(0);
    const lastPowerupsRef = useRef({ shieldUntil: 0, speedUntil: 0, shrinkUntil: 0 });

    // Keep latest callback refs to avoid re-running effects due to unstable identities
    useEffect(() => {
        onSelectedBallChangeRef.current = onSelectedBallChange;
    }, [onSelectedBallChange]);
    useEffect(() => {
        onSelectedBallMotionRef.current = onSelectedBallMotion;
    }, [onSelectedBallMotion]);
    useEffect(() => {
        onWinRef.current = onWin;
        onLoseRef.current = onLose;
    }, [onWin, onLose]);

    // Keep latest settings in a ref so the render loop reads fresh values without restarting effects
    useEffect(() => {
        settingsRef.current = { enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity };
    }, [enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity]);

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
            // Stop the render loop before mutating ball state to avoid mid-frame inconsistencies
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
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
            // Nudge the render loop to restart if it was stopped after a win/lose
            setForceTick(prev => prev + 1);
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
            const grounded = (player.y + effR) >= (canvas.height - 3);
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
        },
        slamPlayer: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const selected = selectedBallIdRef.current ? ballsRef.current.find(b => b.id === selectedBallIdRef.current) : null;
            let player = selected || ballsRef.current.find(b => b.isStartingBall);
            if (!player) return;
            // Disable slam in gauntlet mode
            if (settingsRef.current?.gameplay && settingsRef.current?.gameplay?.mode === 'gauntlet' || (typeof level === 'object' && level && level.type === 'gravityGauntlet')) {
                return;
            }
            const effR = player.size * Math.max(player.scaleX || 1, player.scaleY || 1);
            const grounded = (player.y + effR) >= (canvas.height - 3);
            if (grounded) return; // Only slam while in the air
            const s = settingsRef.current;
            const g = Math.max(0.05, s.gravityStrength || 0.15);
            const slamVy = Math.max(8, Math.min(18, g * 70));
            player.velY = slamVy;
            player.isSleeping = false;
        }
    }), [ballCount, ballSize, ballVelocity, ballShape, newBallSize, emitSnapshot, level]);

    // Seed balls on mount and when level type changes only
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
    // Initialize WebAudio on first user gesture
    Sound.init();
        const canvas = canvasRef.current;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();

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

        window.addEventListener('resize', handleResize);
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
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, [level?.type]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // Pause/resume the loop without re-seeding
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (isPaused) {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            return;
        }
        const ctx = canvas.getContext('2d');
        // Ensure any prior loop is stopped before starting a new one
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        const render = () => {
            const selectedForDraw = selectedBallIdRef.current ? ballsRef.current.find(b => b.id === selectedBallIdRef.current) : null;
            const s = settingsRef.current;
            // reset deltas
            scoreDeltaRef.current = 0;
            scoredBallsDeltaRef.current = 0;
            removedBallsDeltaRef.current = 0;

            // wrappers record increments from physics; physics uses prev => prev + 1
            const incScore = () => { scoreDeltaRef.current += 1; };
            const incScored = () => { scoredBallsDeltaRef.current += 1; };
            const incRemoved = () => { removedBallsDeltaRef.current += 1; };

            loop(
                ctx,
                ballsRef.current,
                canvas.width,
                canvas.height,
                { enableGravity: s.enableGravity, gravityStrength: s.gravityStrength, ballVelocity: s.ballVelocity, deformation: s.deformation, gameplay: s.gameplay },
                s.backgroundColor,
                1 - (s.trailOpacity * 0.9),
                incScore,
                selectedForDraw,
                level,
                incScored,
                incRemoved,
                () => { loseRef.current = true; }
            );

            // After physics step, if player is grounded, reset air-jump availability
            {
                const canvasEl = canvasRef.current;
                const playerBall = selectedForDraw || ballsRef.current.find(b => b.isStartingBall);
                if (canvasEl && playerBall) {
                    const effR2 = playerBall.size * Math.max(playerBall.scaleX || 1, playerBall.scaleY || 1);
                    const groundedNow = (playerBall.y + effR2) >= (canvasEl.height - 3);
                    if (groundedNow) {
                        playerBall._airJumpAvailable = true;
                    }
                }
            }

            // Fallback: if physics missed the goal overlap due to edge cases, detect it here for the player (selected or starting)
            if (!loseRef.current && level && level.goals && level.goals.length) {
                const playerBall = selectedForDraw || ballsRef.current.find(b => b.isStartingBall);
                if (playerBall) {
                    for (let k = 0; k < level.goals.length; k++) {
                        const g = level.goals[k];
                        if (g.shape === 'circle') {
                            const dx = g.x - playerBall.x;
                            const dy = g.y - playerBall.y;
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            const combined = (playerBall.size) + (g.radius || 0);
                            if (dist <= combined) {
                                const now = Date.now();
                                if (playerBall.shieldUntil && playerBall.shieldUntil > now) {
                                    // consume shield and reflect a bit
                                    playerBall.shieldUntil = undefined;
                                    const inv = dist === 0 ? 0 : 1 / dist;
                                    const nx = dist === 0 ? 1 : dx * inv;
                                    const ny = dist === 0 ? 0 : dy * inv;
                                    const reflect = (playerBall.velX * nx + playerBall.velY * ny) * 2;
                                    playerBall.velX -= reflect * nx;
                                    playerBall.velY -= reflect * ny;
                                    playerBall.x -= nx * (combined - dist + 2);
                                    playerBall.y -= ny * (combined - dist + 2);
                                } else {
                                    loseRef.current = true;
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // Report selected ball motion to App without triggering renders
            if (selectedForDraw && onSelectedBallMotionRef.current) {
                onSelectedBallMotionRef.current({ id: selectedForDraw.id, velX: selectedForDraw.velX });
            }

            // If player powerup timers changed, push a lightweight selection update so HUD can reflect it
            if (selectedForDraw && onSelectedBallChangeRef.current) {
                const lp = lastPowerupsRef.current;
                const su = selectedForDraw.shieldUntil || 0;
                const pu = selectedForDraw.speedUntil || 0;
                const ku = selectedForDraw.shrinkUntil || 0;
                if (su !== lp.shieldUntil || pu !== lp.speedUntil || ku !== lp.shrinkUntil) {
                    lastPowerupsRef.current = { shieldUntil: su, speedUntil: pu, shrinkUntil: ku };
                    // Send only the fields that matter plus id to minimize churn
                    onSelectedBallChangeRef.current({ id: selectedForDraw.id, shieldUntil: su, speedUntil: pu, shrinkUntil: ku });
                }
            }

            // Flush accumulated increments once per frame
            if (scoreDeltaRef.current) setGlobalScore?.(prev => prev + scoreDeltaRef.current);
            if (scoredBallsDeltaRef.current) setScoredBallsCount?.(prev => prev + scoredBallsDeltaRef.current);
            if (removedBallsDeltaRef.current) setRemovedBallsCount?.(prev => prev + removedBallsDeltaRef.current);

            // Lose condition triggered in physics — take precedence over win if both occur same frame
            if (loseRef.current) {
                loseRef.current = false;
                Sound.playLose();
                if (onLoseRef.current) onLoseRef.current();
                animationFrameId.current = null;
                return; // stop loop
            }

            // Gauntlet win condition: if in gauntlet and all remaining balls are the starting/player ball only, declare win
            if (level && level.type === 'gravityGauntlet') {
                const nonPlayer = ballsRef.current.filter(b => !b.isStartingBall);
                if (nonPlayer.length === 0) {
                    Sound.playWin();
                    if (onWinRef.current) onWinRef.current();
                    animationFrameId.current = null;
                    return; // stop loop; App can show overlay
                }
            }

            animationFrameId.current = requestAnimationFrame(render);
        };
        render();
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [isPaused, level, forceTick, setGlobalScore, setScoredBallsCount, setRemovedBallsCount]);

    // Reconcile when count/size/velocity/shape change (without full re-seed)
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

    // Apply shape change to existing balls when enabled (no full reseed)
    useEffect(() => {
        if (!applyShapeToExisting) {
            // keep tracker in sync but do not mutate existing
            lastAppliedShapeRef.current = ballShape;
            return;
        }
        if (ballShape === lastAppliedShapeRef.current) return;
        ballsRef.current.forEach(ball => { ball.shape = ballShape; });
        emitSnapshot();
        lastAppliedShapeRef.current = ballShape;
    }, [applyShapeToExisting, ballShape, emitSnapshot]);

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