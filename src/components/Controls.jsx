import { useRef, useState, useEffect, useCallback } from 'react';
import Slider from './Slider.jsx';
import { usePersistentDetails } from '../hooks/usePersistentDetails.js';
import { beginUiDrag, endUiDrag } from '../utils/dom.js';

function Controls({
    physicsSettings,
    onPhysicsSettingsChange,
    onAddBall,
    onRemoveBall,
    onResetBalls,
    levelMode,
    toggleLevelMode,
    onResetToDefaults,
    musicOn,
    musicVolume,
    onMusicVolumeChange,
    onToggleMusicOn,
    sfxVolume,
    sfxMuted,
    onSfxVolumeChange,
    onToggleSfxMute,
}) {
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
        if (draggingRef.current) {
            endUiDrag();
        }
        draggingRef.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', teardown);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', teardown);
    }, [onMove]);
    const onHandleDown = useCallback((ev) => {
        ev.preventDefault();
        draggingRef.current = true;
        beginUiDrag();
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
    const audioRef = useRef(null);
    // Nested advanced sections persist expansion state too
    const gameplayAdvancedRef = useRef(null);
    const visualsAdvancedRef = useRef(null);
    const deformationAdvancedRef = useRef(null);
    // Removed presets section

    usePersistentDetails([
        simulationRef,
        visualsRef,
        deformationRef,
        gameplayRef,
        objectsRef,
        gameplayAdvancedRef,
        visualsAdvancedRef,
    deformationAdvancedRef,
    audioRef,
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
            <h2>Controls</h2>
            <div className="control-group" style={{ display: 'grid', gap: 8 }}>
                <button onClick={toggleLevelMode} className="button button--primary button--full">
                    Switch to {levelMode ? 'Sandbox' : 'Gravity Gauntlet'} Mode
                </button>
                <button onClick={onResetToDefaults} className="button button--secondary button--full">
                    Reset Settings to Defaults
                </button>
            </div>
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
                    <details id="section-visuals-advanced" ref={visualsAdvancedRef} style={{ marginTop: 8 }}>
                        <summary>Advanced</summary>
                        <div className="control-group" style={{ marginTop: 6 }}>
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
                    <details id="section-deformation-advanced" ref={deformationAdvancedRef} style={{ marginTop: 8 }}>
                        <summary>Advanced</summary>
                        <div className="control-group" style={{ marginTop: 6 }}>
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
                        <div className="control-group" style={{ marginTop: 6 }}>
                            <label>Ease Override:</label>
                            <input
                                type="text"
                                value={physicsSettings.deformation.easeOverride}
                                onChange={(e) => handleDeformationChange('easeOverride', e.target.value)}
                                placeholder="e.g., elastic.out(1, 0.3)"
                            />
                        </div>
                    </details>
                </div>
            </details>

            <details id="section-gameplay" open ref={gameplayRef}>
                <summary>Gameplay</summary>
                <div className="section-body">
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
                    <details id="section-gameplay-advanced" ref={gameplayAdvancedRef} style={{ marginTop: 8 }}>
                        <summary>Advanced</summary>
                        <div className="control-group" style={{ marginTop: 6 }}>
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
                        {!levelMode && (
                            <button onClick={onRemoveBall} disabled={!physicsSettings?.gameplay?.popDespawnEnabled} title={!physicsSettings?.gameplay?.popDespawnEnabled ? 'Enable "Pop + Despawn on Remove" to remove balls' : undefined}>
                                Remove Ball
                            </button>
                        )}
                        <button onClick={onResetBalls}>Reset Balls</button>
                    </div>
                </div>
            </details>

            <details id="section-audio" open ref={audioRef}>
                <summary>Audio</summary>
                <div className="section-body">
                    <div className="control-group" style={{ marginBottom: 6 }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={!!musicOn}
                                onChange={onToggleMusicOn}
                            />{' '}
                            Enable Music
                        </label>
                    </div>
                    <Slider
                        label={`Music Volume`}
                        min={0}
                        max={0.5}
                        step={0.01}
                        value={musicVolume}
                        onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                        disabled={!musicOn}
                        displayValue={`${Math.round((musicVolume || 0) * 100)}%`}
                    />
                    
                    <hr style={{ margin: '10px 0', opacity: 0.2 }} />
                    <div className="control-group" style={{ marginBottom: 6 }}>
                        <label>
                            <input type="checkbox" checked={!sfxMuted} onChange={onToggleSfxMute} /> Enable SFX
                        </label>
                    </div>
                    <Slider
                        label={`SFX Volume`}
                        min={0}
                        max={1}
                        step={0.01}
                        value={sfxVolume}
                        onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
                        disabled={sfxMuted}
                        displayValue={`${Math.round((sfxVolume || 0) * 100)}%`}
                    />
                </div>
            </details>

            {/* Presets section removed */}
            {/* Add more controls here */}
        </div>
    );
}

export default Controls;