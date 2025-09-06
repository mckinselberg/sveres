import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls.jsx';
import Canvas from './components/Canvas.jsx';
import SelectedBallControls from './components/SelectedBallControls.jsx';
import IntroOverlay from './components/IntroOverlay.jsx';
import GauntletInstructionsOverlay from './components/GauntletInstructionsOverlay.jsx';
import StatusBar from './components/StatusBar.jsx';
import ImportLevelModal from './components/ImportLevelModal.jsx';
import HUDPowerups from './components/HUDPowerups.jsx';
import GameControlsPanel from './components/GameControlsPanel.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import './styles/App.scss';
import Sound from './utils/sound';
import { DEFAULTS, GRAVITY_GAUNTLET_DEFAULTS } from './js/config.jsx';
import { GAME_LEVELS, getLevelById } from './js/levels/levels.js';
import { decideGasDir } from './utils/inputDirection.js';
import { localStorageToJSONString, seedLocalStorageFromHash, setHashFromLocalStorage, buildLevelJSON } from './utils/storage.js';

// Expose handy debug helper to the browser console
if (typeof window !== 'undefined') {
    window.localStorageToJSONString = localStorageToJSONString;
    window.sveresSeedFromHash = seedLocalStorageFromHash;
    window.sveresSetHashFromLocalStorage = setHashFromLocalStorage;
}

// Local storage keys for persistence
const LS_KEYS = {
    levelMode: 'sim:levelMode',
    currentLevelId: 'sim:currentLevelId',
    settingsSandbox: 'sim:settings:sandbox',
    settingsGauntlet: 'sim:settings:gauntlet',
    showControls: 'ui:showControls',
    wasdEnabled: 'ui:wasdEnabled',
    gauntletInstructionsDismissed: 'ui:gauntletInstructions:dismissed',
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
    // level mode (Game) — start from Level 1 (Gravity Gauntlet) by default
    const level1 = getLevelById('gauntlet-1') || GAME_LEVELS[0];
    const base = { ...GRAVITY_GAUNTLET_DEFAULTS, level: { type: level1.type, title: level1.title, difficulty: level1.difficulty, hazards: level1.hazards, goals: level1.goals, powerups: level1.powerups } };
    // Merge saved top-level settings but DO NOT let saved.level override code-defined level
    const merged = { ...base, ...(saved || {}) };
    merged.level = { ...base.level };
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
    // Seed from URL hash as early as possible
    try { seedLocalStorageFromHash(); } catch (e) { /* noop */ void 0; }
    // Hydrate level mode from storage first
    const initialLevelMode = loadJSON(LS_KEYS.levelMode, false);
    // Hydrate settings for the current mode; merge with defaults to fill gaps
    const initialSaved = initialLevelMode
        ? loadJSON(LS_KEYS.settingsGauntlet, null)
        : loadJSON(LS_KEYS.settingsSandbox, null);
    const initialSettings = mergeDefaultsForMode(initialLevelMode, initialSaved);

    const [levelMode, setLevelMode] = useState(initialLevelMode); // false for sandbox, true for level
    const [physicsSettings, setPhysicsSettings] = useState(initialSettings);
    // Persisted current level selection (for game mode)
    const [currentLevelId, setCurrentLevelId] = useState(() => {
        const saved = loadJSON(LS_KEYS.currentLevelId, null);
        return saved || (GAME_LEVELS[0]?.id || 'gauntlet-1');
    });
    const [balls, setBalls] = useState([]); // Deprecated for Canvas-owned state; kept for presets and managers until Phase 2 completes
    // Global score is tracked internally for physics increments but not displayed currently
    const [_, setGlobalScore] = useState(0);
    // Counters currently not displayed; keep setters for engine callbacks
    const [__s, setScoredBallsCount] = useState(0);
    const [__r, setRemovedBallsCount] = useState(0);
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
    const [showGauntletHelp, setShowGauntletHelp] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');
    const [soundOn, setSoundOn] = useState(() => {
        try { const raw = localStorage.getItem('ui:soundOn'); if (raw == null) return true; return JSON.parse(raw); } catch { return true; }
    });
    useEffect(() => {
        Sound.setEnabled(soundOn);
        try { localStorage.setItem('ui:soundOn', JSON.stringify(soundOn)); } catch {}
    }, [soundOn]);
    const handleJump = useCallback(() => {
        if (isGameOver) return;
        canvasRef.current?.jumpPlayer?.();
    }, [isGameOver]);

    // Reload the current level definition from the registry (fresh powerups/goals/hazards)
    const refreshLevelFromRegistry = useCallback(() => {
        if (!levelMode) return;
        const sel = getLevelById(currentLevelId) || GAME_LEVELS[0];
        if (!sel) return;
        const nextLevel = {
            type: sel.type,
            title: sel.title,
            difficulty: sel.difficulty,
            hazards: sel.hazards,
            goals: sel.goals,
            powerups: sel.powerups,
        };
        const mergedLevel = (nextLevel.type === 'gravityGauntlet') ? { ...nextLevel, hazards: [] } : nextLevel;
        setPhysicsSettings(prev => ({ ...prev, level: mergedLevel }));
    }, [levelMode, currentLevelId]);

    const handleShareURL = useCallback(async () => {
        try {
            // Overwrite or set the hash based on current localStorage
            setHashFromLocalStorage(true);
            const href = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(href);
            } else {
                // Fallback: temporary textarea
                const ta = document.createElement('textarea');
                ta.value = href;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e) { /* noop */ void 0; }
                document.body.removeChild(ta);
            }
    } catch (e) { /* noop */ void 0; }
    }, []);

    // Global key handlers in capture phase so game input works even if focus moved to non-editable overlay controls
    useEffect(() => {
        const isEditable = (el) => {
            if (!el) return false;
            const tag = el.tagName ? String(el.tagName).toLowerCase() : '';
            if (el.isContentEditable) return true;
            return tag === 'input' || tag === 'textarea' || tag === 'select';
        };
        const onKeyDownCapture = (event) => {
            const t = event.target;
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            // Allow typing in editables (import modal textarea, etc.)
            if (isEditable(t)) return;
            const k = (typeof event.key === 'string' && event.key.length === 1) ? event.key.toLowerCase() : event.key;
            const handledKeys = new Set([' ', 'Spacebar', 'j', 'p', 'r', 'n', 'm', 'ArrowLeft', 'ArrowRight', 'Shift', 'a', 'd', 'c']);
            if (!handledKeys.has(k)) return;
            // Prevent scrolling/button activation when we handle the key
            event.preventDefault();
        };
        window.addEventListener('keydown', onKeyDownCapture, { capture: true });
        return () => window.removeEventListener('keydown', onKeyDownCapture, { capture: true });
    }, []);

    // Small helper: after safe overlay button clicks, refocus canvas to keep keyboard input seamless
    useEffect(() => {
        const onClick = (e) => {
            const t = e.target;
            if (!t) return;
            // Do not refocus when interacting with editables
            const tag = t.tagName ? String(t.tagName).toLowerCase() : '';
            if (t.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') return;
            // Only act when explicitly opted-in via data-refocus-canvas="true"
            const shouldRefocus = t.closest('[data-refocus-canvas="true"]');
            if (!shouldRefocus) return;
            // Defer to next frame so click can finish
            requestAnimationFrame(() => {
                const cnv = document.querySelector('canvas');
                if (cnv && typeof cnv.focus === 'function') cnv.focus();
            });
        };
        window.addEventListener('click', onClick, true);
        return () => window.removeEventListener('click', onClick, true);
    }, []);

    const handleExportLevel = useCallback(async () => {
        try {
            const json = buildLevelJSON(physicsSettings.level);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(json);
            }
            // Optionally, also log it
            // eslint-disable-next-line no-console
            console.log(json);
    } catch (e) { /* noop */ void 0; }
    }, [physicsSettings.level]);

    // handleImportLevel moved to Import modal flow; not needed here

    const openImportModal = useCallback(() => {
        setImportError('');
        setImportText('');
        setShowImportModal(true);
    }, []);

    const closeImportModal = useCallback(() => {
        setShowImportModal(false);
    }, []);

    const confirmImportModal = useCallback(() => {
        try {
            setImportError('');
            const obj = JSON.parse(importText);
            if (!obj || typeof obj !== 'object') {
                setImportError('Invalid JSON payload.');
                return;
            }
            setPhysicsSettings(prev => ({
                ...prev,
                level: {
                    type: obj.type || prev.level?.type || 'gravityGauntlet',
                    title: obj.title || prev.level?.title || 'Imported Level',
                    difficulty: obj.difficulty || prev.level?.difficulty || 'custom',
                    hazards: Array.isArray(obj.hazards) ? obj.hazards : [],
                    goals: Array.isArray(obj.goals) ? obj.goals : [],
                    powerups: Array.isArray(obj.powerups) ? obj.powerups : [],
                }
            }));
            setShowImportModal(false);
        } catch (e) {
            setImportError('JSON parse error: ' + (e?.message || 'Unknown error'));
        }
    }, [importText]);

    // Reset selection only in sandbox mode; in gauntlet, keep/select the player ball
    // Triggered on true resets: mode toggle, level type change, or ball shape change
    useEffect(() => {
        if (physicsSettings.level && physicsSettings.level.type === 'gravityGauntlet') {
            // counters UI currently disabled; keep internal zeros
        }
        if (!levelMode) {
            setSelectedBall(null);
            setSelectedBallId(null);
        }
    }, [levelMode, physicsSettings.level, physicsSettings.ballShape]);

    const toggleLevelMode = useCallback(() => {
        setLevelMode(prevMode => {
            const newMode = !prevMode;
            // Load last-saved settings for the target mode, or fall back to defaults
            const saved = newMode
                ? loadJSON(LS_KEYS.settingsGauntlet, null)
                : loadJSON(LS_KEYS.settingsSandbox, null);
            const next = mergeDefaultsForMode(newMode, saved);
            setPhysicsSettings(next);
            // If switching into gauntlet, show instructions unless dismissed before
            if (newMode) {
                const dismissed = loadJSON(LS_KEYS.gauntletInstructionsDismissed, false);
                if (!dismissed) setShowGauntletHelp(true);
            }
            return newMode;
        });
        setGlobalScore(0); // Reset score on mode change
    setDidWin(false);
    setDidLose(false);
    }, []);

    const canvasRef = React.useRef(null);
    const handleUpdateSelectedBall = useCallback((updatedBall) => {
        const id = updatedBall.id ?? selectedBallId;
        if (id == null) return;
        // Whitelist fields to avoid accidentally sending stale x/y from snapshots
        const allowed = {};
        const assignIf = (k) => { if (updatedBall[k] !== undefined) allowed[k] = updatedBall[k]; };
        assignIf('color');
        assignIf('originalColor');
        assignIf('size');
        assignIf('originalSize');
        assignIf('shape');
        assignIf('isStatic');
        assignIf('health');
        assignIf('opacity');
        if (typeof updatedBall.controlTuning === 'object') allowed.controlTuning = updatedBall.controlTuning;
        if (typeof updatedBall.velX === 'number') allowed.velX = updatedBall.velX;
        if (typeof updatedBall.velY === 'number') allowed.velY = updatedBall.velY;
        if (updatedBall._lastMultiplier != null) allowed._lastMultiplier = updatedBall._lastMultiplier;
        // Only include x/y if an explicit control intends to move the ball (not used currently)
        if (updatedBall.__allowXY === true) {
            if (typeof updatedBall.x === 'number') allowed.x = updatedBall.x;
            if (typeof updatedBall.y === 'number') allowed.y = updatedBall.y;
        }
        canvasRef.current?.updateSelectedBall?.({ id, ...allowed });
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
            // Don't hijack browser/system shortcuts or typing in inputs
            const t = event.target;
            const tag = t && t.tagName ? String(t.tagName).toLowerCase() : '';
            const isEditable = (t && (t.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'));
            if (event.ctrlKey || event.metaKey || event.altKey || isEditable) {
                return;
            }
            // Normalize single-letter keys to lowercase so Shift+A/D works
            const k = (typeof event.key === 'string' && event.key.length === 1) ? event.key.toLowerCase() : event.key;
            // Always allow toggling controls with 'c'
            if (k === 'c') {
                event.preventDefault();
                setShowControls(v => !v);
                return;
            }
            // During game over, only honor Reset (R)
            if (isGameOver) {
                if (k === 'r') {
                    event.preventDefault();
                    if (levelMode) {
                        // Refresh level so powerups respawn
                        refreshLevelFromRegistry();
                        canvasRef.current?.resetBalls?.();
                        setGlobalScore(0);
                        setScoredBallsCount(0);
                        setRemovedBallsCount(0);
                        setDidWin(false);
                        setDidLose(false);
                        setShowGauntletHelp(false);
                        try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
                    } else {
                        canvasRef.current?.resetBalls?.();
                        setGlobalScore(0);
                    }
                }
                return;
            }
            // Jump on Space if not pausing; keep P as pause key
            if (k === ' ' || event.code === 'Space') {
                event.preventDefault();
                handleJump();
                return;
            }
            if (k === 'p') {
                event.preventDefault();
                setIsPaused(prev => !prev);
                return;
            }

            // Reset key
            if (k === 'r') {
                event.preventDefault();
                if (levelMode) {
                    // Gauntlet reset resets counters too
                    // Refresh level so powerups respawn
                    refreshLevelFromRegistry();
                    canvasRef.current?.resetBalls?.();
                    setGlobalScore(0);
                    setScoredBallsCount(0);
                    setRemovedBallsCount(0);
                    setDidWin(false);
                    setDidLose(false);
                    setShowGauntletHelp(false);
                    try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
                } else {
                    canvasRef.current?.resetBalls?.();
                    setGlobalScore(0);
                }
                return;
            }

            // Track movement keys while held
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','m','n','Shift','j']);
            if (moveKeys.has(k)) {
                // Respect WASD toggle
                if (!wasdEnabled && (k === 'w' || k === 'a' || k === 's' || k === 'd')) {
                    event.preventDefault();
                    return;
                }
                event.preventDefault();
                keysDownRef.current.add(k);

                // Update virtual active direction based on the last direction key pressed
                if ((wasdEnabled && k === 'a') || k === 'ArrowLeft') {
                    activeDirRef.current = -1;
                } else if ((wasdEnabled && k === 'd') || k === 'ArrowRight') {
                    activeDirRef.current = 1;
                }

                if (k === 'j') {
                    handleJump();
                }
            }
        };

        const handleKeyUp = (event) => {
            // Don't hijack browser/system shortcuts or typing in inputs
            const t = event.target;
            const tag = t && t.tagName ? String(t.tagName).toLowerCase() : '';
            const isEditable = (t && (t.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'));
            if (event.ctrlKey || event.metaKey || event.altKey || isEditable) {
                return;
            }
            if (isGameOver) return;
            const k = (typeof event.key === 'string' && event.key.length === 1) ? event.key.toLowerCase() : event.key;
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','m','n','Shift']);
            if (moveKeys.has(k)) {
                event.preventDefault();
                keysDownRef.current.delete(k);

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
                // const hasUp = false;
                // const hasDown = false;
                // Accelerators: 'n' pushes left, 'm' pushes right; Shift also accelerates using current/arrow direction
                const gasLeft = keys.has('n');
                const gasRight = keys.has('m');
                const gas = gasLeft || gasRight || keys.has('Shift');

        // Tunables from selected ball (with sensible defaults)
        const ct = selectedBall.controlTuning || {};
    const baseMaxSpeed = ct.maxSpeedBase ?? 2.0;         // px/frame
    const boostMultiplier = ct.boostMultiplier ?? 2.0;    // gas boost
    const accelRate = ct.accelRate ?? 0.35;               // px/frame^2 toward target
    const accelBoostMultiplier = ct.accelBoostMultiplier ?? 1.4; // stronger accel while gassing
    const epsilon = 0.03;                                 // snap-to-zero threshold

                const maxSpeedX = gas ? baseMaxSpeed * boostMultiplier : baseMaxSpeed; // gas only affects X
                const effectiveAccelX = gas ? accelRate * accelBoostMultiplier : accelRate;

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
                // Primary direction from accelerators; fallback to arrows/WASD when using Shift as gas
                let dirX = 0;
                if (gasLeft && !gasRight) dirX = -1;
                else if (gasRight && !gasLeft) dirX = 1;
                else if (gas) {
                    dirX = decideGasDir({
                        hasLeft,
                        hasRight,
                        gas,
                        velSign,
                        activeDir: activeDirRef.current,
                        lastMotionDir: lastMotionDirRef.current,
                    });
                    if (dirX === 0) dirX = (lastMotionDirRef.current !== 0) ? lastMotionDirRef.current : 1;
                }
                const targetVX = dirX === 0 ? currentVX : dirX * maxSpeedX;
                // Y not controlled by input

                let newVX = currentVX;
                // let newVY = selectedBall.velY; // Y axis is governed by gravity only

                // Helper to move current toward target by up to delta per frame
                const moveTowards = (current, target, delta) => {
                    if (current < target) return Math.min(current + delta, target);
                    if (current > target) return Math.max(current - delta, target);
                    return current;
                };

                // Overrides
                // X-axis: gas/brake control speed, left/right control direction only
                if (gas) {
                    // accelerate toward target velocity with limited delta per frame (only if direction known)
                    if (dirX === 0) {
                        // still no direction; nudge right to get moving
                        newVX = moveTowards(currentVX, maxSpeedX, effectiveAccelX);
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

                // Always push an update when gas/brake is held, or when velocity changed
                const changedX = Math.abs(newVX - currentVX) > 1e-3;
                // const changedY = Math.abs(newVY - selectedBall.velY) > 1e-3;
                const payload = { id: selectedBall.id };
                // Always send X when brake/gas held or X changed
                if (gas && dirX !== 0 || changedX) Object.assign(payload, { velX: newVX });
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
    }, [selectedBall, levelMode, setGlobalScore, isGameOver, wasdEnabled, handleJump, refreshLevelFromRegistry]);

    const toggleControlsVisibility = useCallback(() => {
        setShowControls(!showControls);
    }, [showControls]);

    // Persist controls visibility
    useEffect(() => {
    try { localStorage.setItem(LS_KEYS.showControls, JSON.stringify(showControls)); } catch (e) { /* noop */ void 0; }
    }, [showControls]);

    // Persist WASD toggle
    useEffect(() => {
    try { localStorage.setItem(LS_KEYS.wasdEnabled, JSON.stringify(wasdEnabled)); } catch (e) { /* noop */ void 0; }
    }, [wasdEnabled]);

    // Persist current level id
    useEffect(() => {
    try { localStorage.setItem(LS_KEYS.currentLevelId, JSON.stringify(currentLevelId)); } catch (e) { /* noop */ void 0; }
    }, [currentLevelId]);

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
    } catch (e) { /* noop */ void 0; }
    }, [levelMode]);

    // Persist settings whenever they change (per mode), debounced to reduce jank during slider scrubs
    const _persistTimerRef = React.useRef(null);
    useEffect(() => {
        const key = levelMode ? LS_KEYS.settingsGauntlet : LS_KEYS.settingsSandbox;
        if (_persistTimerRef.current) clearTimeout(_persistTimerRef.current);
        // Prepare snapshot outside the timer to avoid capturing stale values
        const toSave = levelMode ? { ...physicsSettings } : physicsSettings;
        if (levelMode) delete toSave.level;
        _persistTimerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(toSave));
            } catch (e) { /* noop */ void 0; }
        }, 250);
        return () => {
            if (_persistTimerRef.current) clearTimeout(_persistTimerRef.current);
        };
    }, [physicsSettings, levelMode]);

    // Persist level mode toggle
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEYS.levelMode, JSON.stringify(levelMode));
        } catch (e) { /* noop */ void 0; }
    }, [levelMode]);

    // canvasRef declared earlier

    const handleAddBall = useCallback(() => {
        canvasRef.current?.addBall?.();
    }, []);

    // When in game mode or when level selection changes, apply the selected level into physics settings
    useEffect(() => {
        if (!levelMode) return;
        const sel = getLevelById(currentLevelId) || GAME_LEVELS[0];
        if (!sel) return;
        const nextLevel = {
            type: sel.type,
            title: sel.title,
            difficulty: sel.difficulty,
            hazards: sel.hazards,
            goals: sel.goals,
            powerups: sel.powerups,
        };
        const mergedLevel = (nextLevel.type === 'gravityGauntlet') ? { ...nextLevel, hazards: [] } : nextLevel;
        // Always refresh from registry to reflect code changes
        setPhysicsSettings(prev => ({ ...prev, level: mergedLevel }));
    }, [levelMode, currentLevelId]);

    const handleRemoveBall = useCallback(() => {
        canvasRef.current?.removeBall?.();
    }, []);

    const handleResetBalls = useCallback(() => {
        if (levelMode) {
            refreshLevelFromRegistry();
        }
        canvasRef.current?.resetBalls?.();
        setGlobalScore(0);
    }, [levelMode, refreshLevelFromRegistry]);

    const handleResetGauntlet = useCallback(() => {
        refreshLevelFromRegistry();
        canvasRef.current?.resetBalls?.();
        setGlobalScore(0);
        setScoredBallsCount(0);
        setRemovedBallsCount(0);
    setDidWin(false);
    setDidLose(false);
    setShowGauntletHelp(false);
    try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
    }, [refreshLevelFromRegistry]);

    // Show gauntlet help on first load if mode is already gauntlet and not dismissed
    useEffect(() => {
        if (levelMode) {
            const dismissed = loadJSON(LS_KEYS.gauntletInstructionsDismissed, false);
            if (!dismissed) setShowGauntletHelp(true);
        }
    }, [levelMode]);

    return (
        <div>
            <IntroOverlay />
            <h1 className="page-title">Bouncing Spheres - React</h1>
            {/* <div className="global-score">Global Score: <span>{globalScore}</span></div> */}
            <StatusBar uiOpacity={physicsSettings.visuals.uiOpacity} levelMode={levelMode} level={physicsSettings.level} isPaused={isPaused} />
            {/* {levelMode && (
                <div className="ball-counters">
                    <div>Balls Remaining: <span>{initialBallCount - scoredBallsCount - removedBallsCount}</span></div>
                    <div>Scored: <span>{scoredBallsCount}</span></div>
                    <div>Removed: <span>{removedBallsCount}</span></div>
                </div>
            )} */}
            <GameControlsPanel
                uiOpacity={physicsSettings.visuals.uiOpacity}
                levelMode={levelMode}
                wasdEnabled={wasdEnabled}
                onToggleWasd={() => setWasdEnabled(v => !v)}
                soundOn={soundOn}
                onToggleSound={() => setSoundOn(v => !v)}
                onResetGauntlet={handleResetGauntlet}
                onShowInstructions={() => setShowGauntletHelp(true)}
                onJump={handleJump}
                onShareURL={handleShareURL}
                onExportLevel={handleExportLevel}
                levelSelectNode={levelMode ? (
                    <LevelSelect
                        levels={GAME_LEVELS}
                        currentLevelId={currentLevelId}
                        onChangeLevel={setCurrentLevelId}
                        onOpenImport={openImportModal}
                    />
                ) : null}
            />
            <ImportLevelModal
                open={showImportModal}
                importText={importText}
                importError={importError}
                setImportText={setImportText}
                onCancel={closeImportModal}
                onConfirm={() => {
                    if (!importText.trim()) {
                        setImportError('Please paste a JSON payload.');
                        return;
                    }
                    confirmImportModal();
                }}
            />
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
            {levelMode && showGauntletHelp && (
                <GauntletInstructionsOverlay
                    onClose={() => {
                        setShowGauntletHelp(false);
                        try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
                    }}
                    onReset={handleResetGauntlet}
                />
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
            {/* Lightweight HUD: show active powerups on the player with countdowns */}
            {levelMode && selectedBall && <HUDPowerups selectedBall={selectedBall} />}
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
                    soundOn={soundOn}
                    onToggleSound={setSoundOn}
                />
            )}
            <SelectedBallControls
                selectedBall={selectedBall}
                onUpdateSelectedBall={handleUpdateSelectedBall}
            />
            <button className="toggle-controls-button" data-refocus-canvas="true" aria-label="Toggle Controls" onClick={toggleControlsVisibility}>⚙️</button>
        </div>
    );
}

export default App;