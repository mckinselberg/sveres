import { useRef, useState, useEffect, useCallback } from 'react';
import Slider from './Slider.jsx';
import { usePersistentDetails } from '../hooks/usePersistentDetails.js';

function Controls({ physicsSettings, onPhysicsSettingsChange, onAddBall, onRemoveBall, onResetBalls, levelMode, toggleLevelMode, onResetToDefaults }) {
    // Persisted resizable width for the controls panel
    const LS_KEY_PANEL_WIDTH = 'ui:controlsPanelWidth';
    const readSavedWidth = () => {
        try {
            const raw = localStorage.getItem(LS_KEY_PANEL_WIDTH);
            if (!raw) return null;
            const n = parseInt(raw, 10);
            return Number.isFinite(n) ? n : null;
        } catch {
            return null;
        }
    };
    const clampWidth = (w) => {
        const min = 280;
        const max = Math.floor(window.innerWidth * 0.7);
        return Math.max(min, Math.min(max, w));
    };
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = readSavedWidth();
        const fallback = clampWidth(Math.floor(window.innerWidth * 0.33));
        return clampWidth(saved ?? fallback);
    });
    useEffect(() => {
        try { localStorage.setItem(LS_KEY_PANEL_WIDTH, String(panelWidth)); } catch {}
    }, [panelWidth]);
    // Re-clamp on window resize (rare edge)
    useEffect(() => {
        const onWinResize = () => setPanelWidth((w) => clampWidth(w));
        window.addEventListener('resize', onWinResize);
        return () => window.removeEventListener('resize', onWinResize);
    }, []);

    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const startWRef = useRef(0);
    const getClientX = (ev) => (ev.touches && ev.touches[0]?.clientX) || ev.clientX;
    const onMove = useCallback((ev) => {
        if (!draggingRef.current) return;
        if (ev.touches) ev.preventDefault();
        const dx = getClientX(ev) - startXRef.current;
        setPanelWidth(clampWidth(startWRef.current + dx));
    }, []);
    const teardown = useCallback(() => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', teardown);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', teardown);
    }, [onMove]);
    const onHandleDown = useCallback((ev) => {
        ev.preventDefault();
        draggingRef.current = true;
        startXRef.current = getClientX(ev);
        startWRef.current = panelWidth;
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', teardown);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', teardown);
    }, [panelWidth, onMove, teardown]);
    const simulationRef = useRef(null);
    const visualsRef = useRef(null);
    const deformationRef = useRef(null);
    const gameplayRef = useRef(null);
    const objectsRef = useRef(null);
    // Removed presets section

    usePersistentDetails([
        simulationRef,
        visualsRef,
        deformationRef,
        gameplayRef,
        objectsRef,
    ]);

    const handleSliderChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            [setting]: parseFloat(value)
        });
    };

    const handleCheckboxChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            [setting]: value
        });
    };

    const handleVisualsChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            visuals: {
                ...physicsSettings.visuals,
                [setting]: value
            }
        });
    };

    const handleDeformationChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            deformation: {
                ...physicsSettings.deformation,
                [setting]: value
            }
        });
    };

    const handleGameplayChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            gameplay: {
                ...physicsSettings.gameplay,
                [setting]: value
            }
        });
    };

    const handleBallShapeChange = (value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            ballShape: value
        });
    };

    // Presets removed

    return (
        <div className="controls-panel" style={{ width: panelWidth }}>
            <div
                className="resize-handle"
                onMouseDown={onHandleDown}
                onTouchStart={onHandleDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize controls panel"
            />
            <h2>Simulation Controls</h2>
            <button onClick={toggleLevelMode} className="button button--primary button--full" style={{ marginBottom: '10px' }}>
                Switch to {levelMode ? 'Sandbox' : 'Gravity Gauntlet'} Mode
            </button>
            <button onClick={onResetToDefaults} className="button button--secondary button--full" style={{ marginBottom: '10px' }}>
                Reset Settings to Defaults
            </button>
            <details id="section-simulation" open ref={simulationRef}>
                <summary>Simulation</summary>
                <div className="section-body">
                    {!levelMode && (
                        <>
                            <Slider
                                label="Ball Count"
                                min={3}
                                max={500}
                                step={1}
                                value={physicsSettings.ballCount}
                                onChange={(e) => handleSliderChange('ballCount', e.target.value)}
                                logarithmic
                            />
                            <Slider
                                label="Ball Size"
                                min={10}
                                max={150}
                                step={1}
                                value={physicsSettings.ballSize}
                                onChange={(e) => handleSliderChange('ballSize', e.target.value)}
                                displayValue={`${physicsSettings.ballSize}px`}
                            />
                            <Slider
                                label="Ball Velocity"
                                min={1}
                                max={15}
                                step={1}
                                value={physicsSettings.ballVelocity}
                                onChange={(e) => handleSliderChange('ballVelocity', e.target.value)}
                            />
                        </>
                    )}
                    <Slider
                        label="Gravity Strength"
                        min={0}
                        max={1}
                        step={0.01}
                        value={physicsSettings.gravityStrength}
                        onChange={(e) => handleSliderChange('gravityStrength', e.target.value)}
                        disabled={levelMode && physicsSettings.enableGravity} // Disable if in level mode and gravity is enabled by level
                    />
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={physicsSettings.enableGravity}
                                onChange={(e) => handleCheckboxChange('enableGravity', e.target.checked)}
                                disabled={levelMode && physicsSettings.enableGravity} // Disable if in level mode and gravity is enabled by level
                            />
                            Enable Gravity
                        </label>
                    </div>
                </div>
            </details>

            <details id="section-visuals" open ref={visualsRef}>
                <summary>Visuals</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>Background Color:</label>
                        <input
                            type="color"
                            value={physicsSettings.visuals.backgroundColor}
                            onChange={(e) => handleVisualsChange('backgroundColor', e.target.value)}
                        />
                    </div>
                    <Slider
                        label="Trail Opacity"
                        min={0}
                        max={1}
                        step={0.01}
                        value={physicsSettings.visuals.trailOpacity}
                        onChange={(e) => handleVisualsChange('trailOpacity', e.target.value)}
                    />
                    <Slider
                        label="UI Opacity"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={physicsSettings.visuals.uiOpacity}
                        onChange={(e) => handleVisualsChange('uiOpacity', e.target.value)}
                    />
                </div>
            </details>

            <details id="section-deformation" open ref={deformationRef}>
                <summary>Deformation</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={physicsSettings.deformation.enabled}
                                onChange={(e) => handleDeformationChange('enabled', e.target.checked)}
                            />
                            Enable Deformation
                        </label>
                    </div>
                    <Slider
                        label="Deformation Intensity"
                        min={0.1}
                        max={1.5}
                        step={0.1}
                        value={physicsSettings.deformation.intensity}
                        onChange={(e) => handleDeformationChange('intensity', e.target.value)}
                    />
                    <Slider
                        label="Deformation Speed"
                        min={0.01}
                        max={0.1}
                        step={0.01}
                        value={physicsSettings.deformation.speed}
                        onChange={(e) => handleDeformationChange('speed', e.target.value)}
                    />
                    <div className="control-group">
                        <label>Deformation Ease:</label>
                        <select
                            value={physicsSettings.deformation.ease}
                            onChange={(e) => handleDeformationChange('ease', e.target.value)}
                        >
                            <option value="elastic.out(1.1, 0.5)">Elastic</option>
                            <option value="bounce.out">Bounce</option>
                            <option value="power2.out">Smooth</option>
                            <option value="back.out(1.7)">Overshoot</option>
                            <option value="slow(0.7, 0.7, false)">Slow Mo</option>
                            <option value="steps(12)">Stepped</option>
                            <option value="circ.out">Circular</option>
                            <option value="expo.out">Exponential</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label>Ease Override:</label>
                        <input
                            type="text"
                            value={physicsSettings.deformation.easeOverride}
                            onChange={(e) => handleDeformationChange('easeOverride', e.target.value)}
                            placeholder="e.g., elastic.out(1, 0.3)"
                        />
                    </div>
                </div>
            </details>

            <details id="section-gameplay" open ref={gameplayRef}>
                <summary>Gameplay</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={physicsSettings.gameplay.scoring}
                                onChange={(e) => handleGameplayChange('scoring', e.target.checked)}
                                disabled={levelMode} // Disable in level mode
                            />
                            Enable Scoring
                        </label>
                    </div>
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={physicsSettings.gameplay.sandbox}
                                onChange={(e) => handleGameplayChange('sandbox', e.target.checked)}
                                disabled={levelMode} // Disable in level mode
                            />
                            Sandbox Mode (No Ball Removal)
                        </label>
                    </div>
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={physicsSettings.gameplay.healthSystem}
                                onChange={(e) => handleGameplayChange('healthSystem', e.target.checked)}
                                disabled={levelMode} // Disable in level mode
                            />
                            Enable Health System
                        </label>
                    </div>
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={!!physicsSettings.gameplay.popDespawnEnabled}
                                onChange={(e) => handleGameplayChange('popDespawnEnabled', e.target.checked)}
                            />
                            Pop + Despawn on Remove
                        </label>
                    </div>
                    <Slider
                        label="Health Damage Multiplier"
                        min={0.01}
                        max={1.0}
                        step={0.01}
                        value={physicsSettings.gameplay.healthDamageMultiplier}
                        onChange={(e) => handleGameplayChange('healthDamageMultiplier', e.target.value)}
                        disabled={levelMode} // Disable in level mode
                    />
                </div>
            </details>

            <details id="section-objects" open ref={objectsRef}>
                <summary>Objects</summary>
                <div className="section-body">
                    {!levelMode && (
                        <div className="control-group">
                            <label>Ball Shape:</label>
                            <select
                                value={physicsSettings.ballShape}
                                onChange={(e) => handleBallShapeChange(e.target.value)}
                            >
                                <option value="circle">Circle</option>
                                <option value="square">Square</option>
                                <option value="triangle">Triangle</option>
                                <option value="diamond">Diamond</option>
                                <option value="pentagon">Pentagon</option>
                                <option value="hexagon">Hexagon</option>
                                <option value="octagon">Octagon</option>
                                <option value="star">Star</option>
                                <option value="mixed">Mixed Shapes</option>
                            </select>
                            <div style={{ marginTop: 6 }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!physicsSettings.applyShapeToExisting}
                                        onChange={(e) => handleCheckboxChange('applyShapeToExisting', e.target.checked)}
                                    />{' '}
                                    Apply to existing balls
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="control-group">
                        {!levelMode && <button onClick={onAddBall}>Add Ball</button>}
                        {!levelMode && (
                            <Slider
                                label="New Ball Size"
                                min={10}
                                max={150}
                                step={1}
                                value={physicsSettings.newBallSize}
                                onChange={(e) => handleSliderChange('newBallSize', e.target.value)}
                                displayValue={`${physicsSettings.newBallSize}px`}
                            />
                        )}
                        {!levelMode && <button onClick={onRemoveBall}>Remove Ball</button>}
                        <button onClick={onResetBalls}>Reset Balls</button>
                    </div>
                </div>
            </details>

            {/* Presets section removed */}
            {/* Add more controls here */}
        </div>
    );
}

export default Controls;