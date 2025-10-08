import { useRef, useState, useEffect, useCallback } from 'react';
import Slider from './Slider.jsx';
import { usePersistentDetails } from '../hooks/usePersistentDetails.js';
import { beginUiDrag, endUiDrag } from '../utils/dom.js';
import Sound from '../utils/sound';

function Controls({
    physicsSettings,
    onPhysicsSettingsChange,
    onAddBall,
    onRemoveBall,
    onResetBalls,
    levelMode,
    toggleLevelMode,
    onResetToDefaults,
    fpsLimit,
    onFpsLimitChange,
    musicOn,
    musicVolume,
    onMusicVolumeChange,
    onToggleMusicOn,
    bgmTracks,
    onAddBgmTrack,
    onRemoveBgmTrack,
    onToggleBgmTrack,
    bgmTrackGains,
    onSetBgmTrackGain,
    bgmSongs,
    selectedBgmSong,
    onSaveBgmSong,
    onLoadBgmSong,
    onDeleteBgmSong,
    onSelectBgmSong,
    onMuteAllBgmTracks,
    onUnmuteAllBgmTracks,
    sfxVolume,
    sfxMuted,
    onSfxVolumeChange,
    onToggleSfxMute,
}) {
    // Lightweight playing-state poller for BGM tracks
    const [bgmPlayingStates, setBgmPlayingStates] = useState([]);
    useEffect(() => {
        let intervalId = null;
        const update = () => {
            try {
                if (!musicOn || !Array.isArray(bgmTracks) || bgmTracks.length === 0) {
                    setBgmPlayingStates([]);
                    return;
                }
                const next = bgmTracks.map((_, id) => {
                    try { return !!Sound.isBgmPlaying(id); } catch { return false; }
                });
                setBgmPlayingStates(next);
            } catch {
                setBgmPlayingStates([]);
            }
        };
        update();
        intervalId = window.setInterval(update, 450);
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [musicOn, bgmTracks]);
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

    const handleLevelChange = (setting, value) => {
        onPhysicsSettingsChange({
            ...physicsSettings,
            level: {
                ...(physicsSettings.level || {}),
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
                    Switch to {levelMode ? 'Sandbox' : 'Game'} Mode
                </button>
                <button onClick={onResetToDefaults} className="button button--secondary button--full">
                    Reset Settings to Defaults
                </button>
            </div>
            <details id="section-simulation" open ref={simulationRef}>
                <summary>Simulation</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>FPS Limit:</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {(() => {
                                const presets = new Set([0, 30, 60, 120]);
                                const isPreset = presets.has(Number(fpsLimit || 0));
                                const selectValue = isPreset ? String(fpsLimit || 0) : 'custom';
                                return (
                                    <>
                                        <select
                                            value={selectValue}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === 'custom') { onFpsLimitChange(1); return; } // switch to custom with safe default
                                                const n = parseInt(v, 10);
                                                onFpsLimitChange(Number.isFinite(n) ? n : 0);
                                            }}
                                        >
                                            <option value="0">Off (VSync)</option>
                                            <option value="30">30 FPS</option>
                                            <option value="60">60 FPS</option>
                                            <option value="120">120 FPS</option>
                                            <option value="custom">Custom…</option>
                                        </select>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            max={240}
                                            step={1}
                                            value={Number(fpsLimit || 0) > 0 ? String(fpsLimit) : ''}
                                            onChange={(e) => {
                                                const n = parseInt(e.target.value, 10);
                                                if (!Number.isFinite(n)) return;
                                                const clamped = Math.max(1, Math.min(240, n));
                                                onFpsLimitChange(clamped);
                                            }}
                                            placeholder="Custom"
                                            title="Custom FPS cap (1–240)"
                                            style={{ width: 90 }}
                                            disabled={selectValue !== 'custom'}
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    </div>
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
                        <div className="control-group" style={{ marginTop: 6 }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!physicsSettings?.gameplay?.showIFrameRing}
                                    onChange={(e) => handleGameplayChange('showIFrameRing', e.target.checked)}
                                />{' '}
                                Show i-frame ring
                            </label>
                        </div>
                        {levelMode && (
                            <div className="control-group" style={{ marginTop: 6 }}>
                                <Slider
                                    label="Invulnerability (i-frame) ms"
                                    min={0}
                                    max={2000}
                                    step={50}
                                    value={Math.max(0, Number(physicsSettings?.level?.iFrameMs || 0))}
                                    onChange={(e) => handleLevelChange('iFrameMs', parseInt(e.target.value, 10) || 0)}
                                />
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    Current: {Math.max(0, Number(physicsSettings?.level?.iFrameMs || 0))} ms
                                </div>
                            </div>
                        )}
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
                    {/* Multi-BGM controls */}
                    <div className="control-group" style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong>BGM Tracks</strong>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={onAddBgmTrack}
                                    disabled={!musicOn || (Array.isArray(bgmTracks) && bgmTracks.length >= 10)}
                                    title="Add track"
                                    aria-label="Add BGM track"
                                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >➕</button>
                                <button
                                    type="button"
                                    onClick={onRemoveBgmTrack}
                                    disabled={!musicOn || !Array.isArray(bgmTracks) || bgmTracks.length <= 0}
                                    title="Remove track"
                                    aria-label="Remove BGM track"
                                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >➖</button>
                                <button
                                    type="button"
                                    onClick={onMuteAllBgmTracks}
                                    disabled={!musicOn || !Array.isArray(bgmTracks) || bgmTracks.length === 0}
                                    title="Mute all tracks"
                                    aria-label="Mute all BGM tracks"
                                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >🔇</button>
                                <button
                                    type="button"
                                    onClick={onUnmuteAllBgmTracks}
                                    disabled={!musicOn || !Array.isArray(bgmTracks) || bgmTracks.length === 0}
                                    title="Unmute all tracks"
                                    aria-label="Unmute all BGM tracks"
                                    style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >🔊</button>
                            </div>
                        </div>
                        {Array.isArray(bgmTracks) && bgmTracks.length > 0 ? (
                            <div style={{ display: 'grid', gap: 4 }}>
                                {bgmTracks.map((on, id) => (
                                    <div key={id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={!!on}
                                                disabled={!musicOn}
                                                onChange={() => onToggleBgmTrack(id)}
                                            />
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <span
                                                    aria-label={bgmPlayingStates?.[id] ? 'Playing' : 'Stopped'}
                                                    title={bgmPlayingStates?.[id] ? 'Playing' : 'Stopped'}
                                                    style={{
                                                        display: 'inline-block',
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 6,
                                                        background: bgmPlayingStates?.[id] ? '#3ddc84' : 'rgba(255,255,255,0.25)',
                                                        boxShadow: bgmPlayingStates?.[id] ? '0 0 6px rgba(61,220,132,0.9)' : 'none',
                                                    }}
                                                />
                                                Track {id + 1}
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={bgmTrackGains?.[id] ?? 1}
                                            onChange={(e) => onSetBgmTrackGain(id, parseFloat(e.target.value))}
                                            disabled={!musicOn}
                                            aria-label={`Track ${id + 1} gain`}
                                        />
                                        <span style={{ fontSize: 12, opacity: 0.8, width: '5ch', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {Math.round(((bgmTrackGains?.[id] ?? 1) * 100))}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, opacity: 0.8 }}>No tracks configured.</div>
                        )}
                    </div>
                    {/* Songs persistence */}
                    <div className="control-group" style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Song name"
                                value={selectedBgmSong || ''}
                                onChange={(e) => onSelectBgmSong(e.target.value)}
                                style={{ flex: 1, minWidth: 0 }}
                                disabled={!musicOn}
                                aria-label="Song name"
                            />
                            <button
                                type="button"
                                onClick={() => onSaveBgmSong(selectedBgmSong)}
                                disabled={!musicOn || !(selectedBgmSong || '').trim()}
                                title="Save current tracks as song"
                                style={{ padding: '4px 8px' }}
                            >Save</button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!musicOn) return;
                                    const name = window.prompt('Save As… Enter a new song name:', (selectedBgmSong || '').trim() || 'My Song');
                                    const trimmed = (name || '').trim();
                                    if (!trimmed) return;
                                    if (bgmSongs && Object.prototype.hasOwnProperty.call(bgmSongs, trimmed)) {
                                        const ok = window.confirm(`A song named "${trimmed}" already exists. Overwrite?`);
                                        if (!ok) return;
                                    }
                                    onSaveBgmSong(trimmed);
                                }}
                                disabled={!musicOn}
                                title="Save current tracks under a new name"
                                style={{ padding: '4px 8px' }}
                            >Save As…</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <select
                                value={(selectedBgmSong && bgmSongs && bgmSongs[selectedBgmSong]) ? selectedBgmSong : ''}
                                onChange={(e) => onSelectBgmSong(e.target.value)}
                                style={{ flex: 1, minWidth: 0 }}
                                disabled={!musicOn || !bgmSongs || Object.keys(bgmSongs).length === 0}
                                aria-label="Saved songs"
                            >
                                <option value="">Select saved song…</option>
                                {bgmSongs && Object.keys(bgmSongs).sort().map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => onLoadBgmSong(selectedBgmSong)}
                                disabled={!musicOn || !selectedBgmSong || !bgmSongs || !bgmSongs[selectedBgmSong]}
                                title="Load selected song"
                                style={{ padding: '4px 8px' }}
                            >Load</button>
                            <button
                                type="button"
                                onClick={() => onDeleteBgmSong(selectedBgmSong)}
                                disabled={!selectedBgmSong || !bgmSongs || !bgmSongs[selectedBgmSong]}
                                title="Delete selected song"
                                style={{ padding: '4px 8px' }}
                            >Delete</button>
                        </div>
                    </div>
                    <Slider
                        label={`Music Volume`}
                        min={0}
                        max={1}
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