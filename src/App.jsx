import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls.jsx';
import Canvas from './components/Canvas.jsx';
import SelectedBallControls from './components/SelectedBallControls.jsx';
import IntroOverlay from './components/IntroOverlay.jsx';
import './styles/App.scss';
import { DEFAULTS, GRAVITY_GAUNTLET_DEFAULTS } from './js/config.jsx';

function App() {
    const [levelMode, setLevelMode] = useState(false); // false for sandbox, true for level
    const [physicsSettings, setPhysicsSettings] = useState(levelMode ? GRAVITY_GAUNTLET_DEFAULTS : DEFAULTS);
    const [balls, setBalls] = useState([]); // Deprecated for Canvas-owned state; kept for presets and managers until Phase 2 completes
    const [globalScore, setGlobalScore] = useState(0);
    const [initialBallCount, setInitialBallCount] = useState(0);
    const [scoredBallsCount, setScoredBallsCount] = useState(0);
    const [removedBallsCount, setRemovedBallsCount] = useState(0);
    const [selectedBall, setSelectedBall] = useState(null); // Backward-compatible selected ball object (derived)
    const [selectedBallId, setSelectedBallId] = useState(null); // Stable selection by id
    const [showControls, setShowControls] = useState(true); // State for controls visibility
    const [isPaused, setIsPaused] = useState(false);

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
            setPhysicsSettings(newMode ? GRAVITY_GAUNTLET_DEFAULTS : DEFAULTS);
            return newMode;
        });
        setGlobalScore(0); // Reset score on mode change
    }, []);

    const canvasRef = React.useRef(null);
    const handleUpdateSelectedBall = useCallback((updatedBall) => {
        const payload = { ...updatedBall, id: updatedBall.id ?? selectedBallId };
        canvasRef.current?.updateSelectedBall?.(payload);
    }, [selectedBallId]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === ' ' || event.code === 'Space') {
                event.preventDefault();
                setIsPaused(prev => !prev);
                return;
            }
            if (selectedBall) {
                const moveSpeed = 2;
                let newVelX = selectedBall.velX;
                let newVelY = selectedBall.velY;

                switch (event.key) {
                    case 'w':
                    case 'ArrowUp':
                        event.preventDefault();
                        newVelY = -moveSpeed;
                        break;
                    case 'a':
                    case 'ArrowLeft':
                        event.preventDefault();
                        newVelX = -moveSpeed;
                        break;
                    case 's':
                    case 'ArrowDown':
                        event.preventDefault();
                        newVelY = moveSpeed;
                        break;
                    case 'd':
                    case 'ArrowRight':
                        event.preventDefault();
                        newVelX = moveSpeed;
                        break;
                    case 'm':
                        newVelX *= 1.5;
                        newVelY *= 1.5;
                        break;
                    case 'n':
                        newVelX /= 1.5;
                        newVelY /= 1.5;
                        break;
                    case 'p':
                        // toggle pause
                        event.preventDefault();
                        setIsPaused(prev => !prev);
                        return;
                }
                handleUpdateSelectedBall({ ...selectedBall, velX: newVelX, velY: newVelY, id: selectedBall.id });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedBall, handleUpdateSelectedBall]);

    const toggleControlsVisibility = useCallback(() => {
        setShowControls(!showControls);
    }, [showControls]);

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
            {isPaused && <div className="pause-overlay">Paused (Space / P to resume)</div>}
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