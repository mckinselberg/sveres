import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls.jsx';
import Canvas from './components/Canvas.jsx';
import SelectedBallControls from './components/SelectedBallControls.jsx';
import IntroOverlay from './components/IntroOverlay.jsx';
import './styles/App.scss';
import { DEFAULTS, GRAVITY_GAUNTLET_DEFAULTS } from './js/config.jsx';
import { decideGasDir } from './utils/inputDirection.js';

// Local storage keys for persistence
const LS_KEYS = {
    levelMode: 'sim:levelMode',
    settingsSandbox: 'sim:settings:sandbox',
    settingsGauntlet: 'sim:settings:gauntlet',
    showControls: 'ui:showControls',
    wasdEnabled: 'ui:wasdEnabled',
};

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function mergeDefaultsForMode(mode, saved) {
    // Ensure any newly added fields get defaults while honoring saved values
    if (mode) {
        // level mode (Gravity Gauntlet)
        const merged = { ...GRAVITY_GAUNTLET_DEFAULTS, ...(saved || {}) };
        // Explicitly clear hazards in gauntlet mode
        if (merged.level && merged.level.type === 'gravityGauntlet') {
            merged.level = { ...merged.level, hazards: [] };
        }
        return merged;
    }
    // sandbox mode
    return { ...DEFAULTS, ...(saved || {}) };
}

function App() {
    // Hydrate level mode from storage first
    const initialLevelMode = loadJSON(LS_KEYS.levelMode, false);
    // Hydrate settings for the current mode; merge with defaults to fill gaps
    const initialSaved = initialLevelMode
        ? loadJSON(LS_KEYS.settingsGauntlet, null)
        : loadJSON(LS_KEYS.settingsSandbox, null);
    const initialSettings = mergeDefaultsForMode(initialLevelMode, initialSaved);

    const [levelMode, setLevelMode] = useState(initialLevelMode); // false for sandbox, true for level
    const [physicsSettings, setPhysicsSettings] = useState(initialSettings);
    const [balls, setBalls] = useState([]); // Deprecated for Canvas-owned state; kept for presets and managers until Phase 2 completes
    const [globalScore, setGlobalScore] = useState(0);
    const [initialBallCount, setInitialBallCount] = useState(0);
    const [scoredBallsCount, setScoredBallsCount] = useState(0);
    const [removedBallsCount, setRemovedBallsCount] = useState(0);
    const [selectedBall, setSelectedBall] = useState(null); // Backward-compatible selected ball object (derived)
    const [selectedBallId, setSelectedBallId] = useState(null); // Stable selection by id
    const [showControls, setShowControls] = useState(() => {
        const saved = loadJSON(LS_KEYS.showControls, null);
        return typeof saved === 'boolean' ? saved : true;
    }); // State for controls visibility (persisted)
    const [isPaused, setIsPaused] = useState(false);
    const [didWin, setDidWin] = useState(false);
    const [didLose, setDidLose] = useState(false);
    const isGameOver = didWin || didLose;
    const [wasdEnabled, setWasdEnabled] = useState(() => {
        const saved = loadJSON(LS_KEYS.wasdEnabled, null);
        return typeof saved === 'boolean' ? saved : true;
    });

    // Reset counters and selection on true resets: level mode toggle, level type change, or ball shape change
    useEffect(() => {
        if (physicsSettings.level && physicsSettings.level.type === 'gravityGauntlet') {
            setInitialBallCount(physicsSettings.ballCount);
            setScoredBallsCount(0);
            setRemovedBallsCount(0);
        }
        setSelectedBall(null);
        setSelectedBallId(null);
    }, [levelMode, physicsSettings.level?.type, physicsSettings.ballShape]);

    const toggleLevelMode = useCallback(() => {
        setLevelMode(prevMode => {
            const newMode = !prevMode;
            // Load last-saved settings for the target mode, or fall back to defaults
            const saved = newMode
                ? loadJSON(LS_KEYS.settingsGauntlet, null)
                : loadJSON(LS_KEYS.settingsSandbox, null);
            const next = mergeDefaultsForMode(newMode, saved);
            setPhysicsSettings(next);
            return newMode;
        });
        setGlobalScore(0); // Reset score on mode change
    setDidWin(false);
    setDidLose(false);
    }, []);

    const canvasRef = React.useRef(null);
    const handleUpdateSelectedBall = useCallback((updatedBall) => {
        const payload = { ...updatedBall, id: updatedBall.id ?? selectedBallId };
        canvasRef.current?.updateSelectedBall?.(payload);
    }, [selectedBallId]);

    const keysDownRef = React.useRef(new Set());
    const prevVelXRef = React.useRef(0);
    const activeDirRef = React.useRef(0); // -1 left, 1 right, 0 unknown
    const lastMotionDirRef = React.useRef(0); // last non-zero velocity direction
    const liveVelXRef = React.useRef(0); // instantaneous velX from Canvas callback
    const movementRafRef = React.useRef(null);

    // When disabling WASD, purge any held WASD keys and reset activeDir if no arrows are held
    useEffect(() => {
        if (!wasdEnabled) {
            const kd = keysDownRef.current;
            kd.delete('w'); kd.delete('a'); kd.delete('s'); kd.delete('d');
            const arrowsLeft = kd.has('ArrowLeft');
            const arrowsRight = kd.has('ArrowRight');
            if (!arrowsLeft && !arrowsRight) {
                activeDirRef.current = 0;
            } else if (arrowsLeft && !arrowsRight) {
                activeDirRef.current = -1;
            } else if (arrowsRight && !arrowsLeft) {
                activeDirRef.current = 1;
            }
        }
    }, [wasdEnabled]);

    useEffect(() => {
    const handleKeyDown = (event) => {
            // During game over, only honor Reset (R)
            if (isGameOver) {
                if (event.key === 'r' || event.key === 'R') {
                    event.preventDefault();
                    if (levelMode) {
                        canvasRef.current?.resetBalls?.();
                        setGlobalScore(0);
                        setScoredBallsCount(0);
                        setRemovedBallsCount(0);
                    } else {
                        canvasRef.current?.resetBalls?.();
                        setGlobalScore(0);
                    }
                }
                return;
            }
            // Pause toggles
            if (event.key === ' ' || event.code === 'Space') {
                event.preventDefault();
                setIsPaused(prev => !prev);
                return;
            }
            if (event.key === 'p' || event.key === 'P') {
                event.preventDefault();
                setIsPaused(prev => !prev);
                return;
            }

            // Reset key
            if (event.key === 'r' || event.key === 'R') {
                event.preventDefault();
                if (levelMode) {
                    // Gauntlet reset resets counters too
                    canvasRef.current?.resetBalls?.();
                    setGlobalScore(0);
                    setScoredBallsCount(0);
                    setRemovedBallsCount(0);
                } else {
                    canvasRef.current?.resetBalls?.();
                    setGlobalScore(0);
                }
                return;
            }

            // Track movement keys while held
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','m','n','Shift']);
            if (moveKeys.has(event.key)) {
                // Respect WASD toggle
                if (!wasdEnabled && (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd')) {
                    event.preventDefault();
                    return;
                }
                event.preventDefault();
                keysDownRef.current.add(event.key);

                // Update virtual active direction based on the last direction key pressed
                if ((wasdEnabled && event.key === 'a') || event.key === 'ArrowLeft') {
                    activeDirRef.current = -1;
                } else if ((wasdEnabled && event.key === 'd') || event.key === 'ArrowRight') {
                    activeDirRef.current = 1;
                }
            }
        };

        const handleKeyUp = (event) => {
            if (isGameOver) return;
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','m','n','Shift']);
            if (moveKeys.has(event.key)) {
                event.preventDefault();
                keysDownRef.current.delete(event.key);

                // If releasing a direction key, keep activeDir if the other is still held; otherwise set to 0
                const leftHeld = ((wasdEnabled && keysDownRef.current.has('a')) || keysDownRef.current.has('ArrowLeft'));
                const rightHeld = ((wasdEnabled && keysDownRef.current.has('d')) || keysDownRef.current.has('ArrowRight'));
                if (!leftHeld && !rightHeld) {
                    activeDirRef.current = 0;
                } else if (leftHeld && !rightHeld) {
                    activeDirRef.current = -1;
                } else if (rightHeld && !leftHeld) {
                    activeDirRef.current = 1;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

    // RAF loop to apply movement while keys are held (acceleration-based + per-ball tuning)
        const tick = () => {
            if (isGameOver) {
                movementRafRef.current = requestAnimationFrame(tick);
                return;
            }
            const keys = keysDownRef.current;
            if (selectedBall) {
                const hasLeft = ((wasdEnabled && keys.has('a')) || keys.has('ArrowLeft'));
                const hasRight = ((wasdEnabled && keys.has('d')) || keys.has('ArrowRight'));
                // Up/Down are ignored for Y control so gravity governs Y
                const hasUp = false;
                const hasDown = false;
                const gas = keys.has('m') || keys.has('Shift');
                const brake = keys.has('n');

        // Tunables from selected ball (with sensible defaults)
        const ct = selectedBall.controlTuning || {};
        const baseMaxSpeed = ct.maxSpeedBase ?? 2.0;         // px/frame
        const boostMultiplier = ct.boostMultiplier ?? 2.0;    // gas boost
        const accelRate = ct.accelRate ?? 0.35;               // px/frame^2 toward target
        const accelBoostMultiplier = ct.accelBoostMultiplier ?? 1.4; // stronger accel while gassing
        const releaseFriction = ct.releaseFriction ?? 0.92;   // when no input
        const brakeFriction = ct.brakeFriction ?? 0.75;       // while braking
        const epsilon = 0.03;                                 // snap-to-zero threshold

                const maxSpeedX = gas ? baseMaxSpeed * boostMultiplier : baseMaxSpeed; // gas only affects X
                const maxSpeedY = baseMaxSpeed; // Y unaffected by gas (gravity domain)
                const effectiveAccelX = gas ? accelRate * accelBoostMultiplier : accelRate;
                const effectiveAccelY = accelRate; // Y accel not boosted

                // Determine active direction obeying physics
                // Prefer live velocity from Canvas over possibly stale selectedBall snapshot
                const currentVX = typeof liveVelXRef.current === 'number' ? liveVelXRef.current : selectedBall.velX;
                const velSign = Math.abs(currentVX) < epsilon ? 0 : Math.sign(currentVX);
                if (velSign !== 0) {
                    lastMotionDirRef.current = velSign;
                }
                const prevSign = Math.abs(prevVelXRef.current) < epsilon ? 0 : Math.sign(prevVelXRef.current);
                const flipped = prevSign !== 0 && velSign !== 0 && prevSign !== velSign;

                // On flip, swap the virtual active direction to follow physics
                if (flipped) {
                    activeDirRef.current = velSign;
                }

                // Choose direction using pure helper for consistency and testability
                const dirX = decideGasDir({
                    hasLeft,
                    hasRight,
                    gas,
                    velSign,
                    activeDir: activeDirRef.current,
                    lastMotionDir: lastMotionDirRef.current,
                });
                const targetVX = dirX === 0 ? currentVX : dirX * maxSpeedX;
                const targetVY = null; // Y not controlled by input

                let newVX = currentVX;
                let newVY = selectedBall.velY;

                // Helper to move current toward target by up to delta per frame
                const moveTowards = (current, target, delta) => {
                    if (current < target) return Math.min(current + delta, target);
                    if (current > target) return Math.max(current - delta, target);
                    return current;
                };

                // Overrides
                // X-axis: gas/brake control speed, left/right control direction only
                if (brake) {
                    newVX = 0;
                } else if (gas) {
                    // accelerate toward target velocity with limited delta per frame (only if direction known)
                    if (dirX === 0) {
                        newVX = currentVX; // no direction chosen; keep coasting
                    } else {
                        newVX = moveTowards(currentVX, targetVX, effectiveAccelX);
                    }
                    // snap tiny values to zero to avoid jitter
                    if (Math.abs(newVX) < epsilon) newVX = 0;
                } else {
                    // Coasting: keep current velocity (no release friction)
                    newVX = currentVX;
                }

                // Y-axis untouched by input so gravity in physics loop governs it
                newVY = selectedBall.velY;

                // Always push an update when gas/brake is held, or when velocity changed
                const changedX = Math.abs(newVX - currentVX) > 1e-3;
                const changedY = Math.abs(newVY - selectedBall.velY) > 1e-3;
                const payload = { id: selectedBall.id };
                // Always send X when brake/gas held or X changed
                if ((brake || gas) && dirX !== 0 || changedX) Object.assign(payload, { velX: newVX });
                // Never send Y (no vertical input control)
                if (Object.keys(payload).length > 1) {
                    canvasRef.current?.updateSelectedBall?.(payload);
                }
                // Track previous X velocity sign across frames
                prevVelXRef.current = newVX;
            }
            movementRafRef.current = requestAnimationFrame(tick);
        };
        movementRafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (movementRafRef.current) cancelAnimationFrame(movementRafRef.current);
        };
    }, [selectedBall, levelMode, setGlobalScore, setScoredBallsCount, setRemovedBallsCount, isGameOver, wasdEnabled]);

    const toggleControlsVisibility = useCallback(() => {
        setShowControls(!showControls);
    }, [showControls]);

    // Persist controls visibility
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.showControls, JSON.stringify(showControls)); } catch {}
    }, [showControls]);

    // Persist WASD toggle
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.wasdEnabled, JSON.stringify(wasdEnabled)); } catch {}
    }, [wasdEnabled]);

    const handleApplyColorScheme = useCallback((scheme) => {
        // Update background color via physicsSettings
        setPhysicsSettings(prevSettings => ({
            ...prevSettings,
            visuals: {
                ...prevSettings.visuals,
                backgroundColor: scheme.backgroundColor
            }
        }));
        // Apply ball colors via Canvas engine
        canvasRef.current?.applyColorScheme?.(scheme);
    }, []);

    const handleApplyPhysicsSettings = useCallback((settings) => {
        setPhysicsSettings(settings);
    }, []);

    const handlePhysicsSettingsChange = useCallback((newSettings) => {
        // Let Canvas reconcile ball count/size/speed internally.
        setPhysicsSettings(newSettings);
    }, []);

    const handleResetToDefaults = useCallback(() => {
        const defaults = levelMode ? GRAVITY_GAUNTLET_DEFAULTS : DEFAULTS;
        setPhysicsSettings(defaults);
        // Clear saved settings for this mode to avoid reloading old values later
        try {
            localStorage.removeItem(levelMode ? LS_KEYS.settingsGauntlet : LS_KEYS.settingsSandbox);
        } catch {}
    }, [levelMode]);

    // Persist settings whenever they change (per mode)
    useEffect(() => {
        const key = levelMode ? LS_KEYS.settingsGauntlet : LS_KEYS.settingsSandbox;
        try {
            localStorage.setItem(key, JSON.stringify(physicsSettings));
        } catch {}
    }, [physicsSettings, levelMode]);

    // Persist level mode toggle
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.levelMode, JSON.stringify(levelMode));
        } catch {}
    }, [levelMode]);

    // canvasRef declared earlier

    const handleAddBall = useCallback(() => {
        canvasRef.current?.addBall?.();
    }, []);

    const handleRemoveBall = useCallback(() => {
        canvasRef.current?.removeBall?.();
    }, []);

    const handleResetBalls = useCallback(() => {
        canvasRef.current?.resetBalls?.();
        setGlobalScore(0);
    }, []);

    const handleResetGauntlet = useCallback(() => {
        canvasRef.current?.resetBalls?.();
        setGlobalScore(0);
        setScoredBallsCount(0);
        setRemovedBallsCount(0);
    setDidWin(false);
    setDidLose(false);
    }, []);

    return (
        <div>
            <IntroOverlay />
            <h1 className="page-title">Bouncing Spheres - React</h1>
            <div className="status-bar" style={{ opacity: physicsSettings.visuals.uiOpacity }}>
                <span>Mode: {levelMode ? 'Gravity Gauntlet' : 'Sandbox'}</span>
                {physicsSettings.level && (
                    <span style={{ marginLeft: 12 }}>
                        Level: {physicsSettings.level.title || (physicsSettings.level.type === 'gravityGauntlet' ? 'Gravity Gauntlet' : physicsSettings.level.type)}
                        {physicsSettings.level.difficulty ? ` · ${physicsSettings.level.difficulty}` : ''}
                    </span>
                )}
                <span style={{ marginLeft: 12 }}>{isPaused ? 'Paused' : 'Running'}</span>
            </div>
            <div className="global-score">Global Score: <span>{globalScore}</span></div>
            {levelMode && (
                <div className="ball-counters">
                    <div>Balls Remaining: <span>{initialBallCount - scoredBallsCount - removedBallsCount}</span></div>
                    <div>Scored: <span>{scoredBallsCount}</span></div>
                    <div>Removed: <span>{removedBallsCount}</span></div>
                </div>
            )}
            {levelMode && (
                <button
                    className="gauntlet-reset-button"
                    style={{ opacity: physicsSettings.visuals.uiOpacity }}
                    onClick={handleResetGauntlet}
                    disabled={isGameOver}
                    aria-disabled={isGameOver}
                    aria-label="Reset Gauntlet Level"
                    title="Reset Level"
                >
                    ↻ Reset
                </button>
            )}
            {levelMode && (
                <button
                    className="gauntlet-wasd-toggle"
                    style={{ opacity: physicsSettings.visuals.uiOpacity }}
                    onClick={() => setWasdEnabled(v => !v)}
                    aria-label="Toggle WASD input"
                    title="Toggle WASD input"
                >
                    {wasdEnabled ? 'WASD: On' : 'WASD: Off'}
                </button>
            )}
            {isPaused && <div className="pause-overlay">Paused (Space / P to resume)</div>}
            {didWin && (
                <div className="pause-overlay" style={{ pointerEvents: 'auto' }}>
                    <div style={{ background: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 8 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>You won!</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="button button--primary" onClick={handleResetGauntlet}>Play Again</button>
                        </div>
                    </div>
                </div>
            )}
            {levelMode && didLose && (
                <div className="pause-overlay" style={{ pointerEvents: 'auto' }}>
                    <div style={{ background: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>you lost, reset to play again</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="button button--primary" onClick={handleResetGauntlet} aria-label="Reset Level">Reset</button>
                        </div>
                    </div>
                </div>
            )}
            <Canvas
                ref={canvasRef}
                enableGravity={physicsSettings.enableGravity}
                gravityStrength={physicsSettings.gravityStrength}
                ballVelocity={physicsSettings.ballVelocity}
                deformation={physicsSettings.deformation}
                gameplay={physicsSettings.gameplay}
                backgroundColor={physicsSettings.visuals.backgroundColor}
                trailOpacity={physicsSettings.visuals.trailOpacity}
                setGlobalScore={setGlobalScore}
                selectedBall={selectedBall}
                onSelectedBallChange={useCallback((ball) => {
                    setSelectedBall(ball);
                    setSelectedBallId(ball ? ball.id : null);
                }, [])}
                onBallsSnapshot={setBalls}
                isPaused={isPaused}
                level={physicsSettings.level}
                setScoredBallsCount={setScoredBallsCount}
                setRemovedBallsCount={setRemovedBallsCount}
                ballCount={physicsSettings.ballCount}
                ballSize={physicsSettings.ballSize}
                ballShape={physicsSettings.ballShape}
                newBallSize={physicsSettings.newBallSize}
                onWin={() => setDidWin(true)}
                onLose={() => setDidLose(true)}
                onSelectedBallMotion={useCallback((m) => {
                    if (!m) return;
                    if (typeof m.velX === 'number') {
                        liveVelXRef.current = m.velX;
                        if (Math.abs(m.velX) > 0.001) {
                            lastMotionDirRef.current = Math.sign(m.velX);
                        }
                    }
                }, [])}
            />
            {showControls && (
                                <Controls
                    physicsSettings={physicsSettings}
                    onPhysicsSettingsChange={handlePhysicsSettingsChange}
                    onAddBall={handleAddBall}
                    onRemoveBall={handleRemoveBall}
                    onResetBalls={handleResetBalls}
                    balls={balls}
                    onApplyColorScheme={handleApplyColorScheme}
                    onApplyPhysicsSettings={handleApplyPhysicsSettings}
                    levelMode={levelMode}
                    toggleLevelMode={toggleLevelMode}
                    onResetToDefaults={handleResetToDefaults}
                />
            )}
            <SelectedBallControls
                selectedBall={selectedBall}
                onUpdateSelectedBall={handleUpdateSelectedBall}
            />
            <button className="toggle-controls-button" aria-label="Toggle Controls" onClick={toggleControlsVisibility}>⚙️</button>
        </div>
    );
}

export default App;