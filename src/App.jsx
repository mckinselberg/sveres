import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls.jsx';
import Canvas from './components/Canvas.jsx';
import SelectedBallControls from './components/SelectedBallControls.jsx';
import IntroOverlay from './components/IntroOverlay.jsx';
import GameInstructionsOverlay from './components/GameInstructionsOverlay.jsx';
import StatusBar from './components/StatusBar.jsx';
import ImportLevelModal from './components/ImportLevelModal.jsx';
import HUDPowerups from './components/HUDPowerups.jsx';
import GameControlsPanel from './components/GameControlsPanel.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import './styles/App.scss';
import Sound from './utils/sound';
import { DEFAULTS, GAME_MODE_DEFAULTS } from './js/config.jsx';
import { GAME_LEVELS, getLevelById } from './js/levels/levels.js';
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
    settingsGameMode: 'sim:settings:gameMode',
    gauntletInstructionsDismissed: 'ui:gauntletInstructions:dismissed',
    musicOn: 'ui:musicOn',
    musicVolume: 'ui:musicVolume',
    musicMuted: 'ui:musicMuted',
    sfxVolume: 'ui:sfxVolume',
    sfxMuted: 'ui:sfxMuted',
    fpsLimit: 'ui:fpsLimit',
    bgmTracks: 'ui:bgmTracks',
    bgmSongs: 'ui:bgmSongs',
    bgmSelectedSong: 'ui:bgmSelectedSong',
    bgmTrackGains: 'ui:bgmTrackGains',
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
    const base = { ...GAME_MODE_DEFAULTS, level: { type: level1.type, title: level1.title, difficulty: level1.difficulty, hazards: level1.hazards, goals: level1.goals, powerups: level1.powerups } };
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
    
    // Check for debug invincibility flag in URL
    // Usage: Add ?invincible=true to the URL to make the player ball invincible
    // This is useful for testing perfect run decorations and level mechanics
    const urlParams = new URLSearchParams(window.location.search);
    const isInvincible = urlParams.get('invincible') === 'true';
    // One-time migration: remove legacy ui:soundOn; if it was false, default music off and sfx muted
    try {
        const rawLegacy = localStorage.getItem('ui:soundOn');
        if (rawLegacy != null) {
            const legacyVal = JSON.parse(rawLegacy);
            if (legacyVal === false) {
                if (localStorage.getItem(LS_KEYS.musicOn) == null) {
                    localStorage.setItem(LS_KEYS.musicOn, JSON.stringify(false));
                }
                if (localStorage.getItem(LS_KEYS.sfxMuted) == null) {
                    localStorage.setItem(LS_KEYS.sfxMuted, JSON.stringify(true));
                }
            }
            localStorage.removeItem('ui:soundOn');
        }
    } catch { /* noop */ }
    // Hydrate level mode from storage first
    const initialLevelMode = loadJSON(LS_KEYS.levelMode, false);
    // Hydrate settings for the current mode; merge with defaults to fill gaps
    const initialSaved = initialLevelMode
        ? loadJSON(LS_KEYS.settingsGameMode, null)
        : loadJSON(LS_KEYS.settingsSandbox, null);
    const initialSettings = mergeDefaultsForMode(initialLevelMode, initialSaved);

    const [levelMode, setLevelMode] = useState(initialLevelMode); // false for sandbox, true for level
    const [physicsSettings, setPhysicsSettings] = useState(initialSettings);
    // Persisted current level selection (for game mode)
    const [currentLevelId, setCurrentLevelId] = useState(() => {
        const saved = loadJSON(LS_KEYS.currentLevelId, null);
        return saved || (GAME_LEVELS[0]?.id || 'gauntlet-1');
    });
    // Removed deprecated balls snapshot state (presets UI removed)
    // Global score is tracked internally for physics increments but not displayed currently
    const [_, setGlobalScore] = useState(0);
    // Counters currently not displayed; keep setters for engine callbacks
    const [__s, setScoredBallsCount] = useState(0);
    const [__r, setRemovedBallsCount] = useState(0);
    const [selectedBall, setSelectedBall] = useState(null); // Backward-compatible selected ball object (derived)
    const [selectedBallId, setSelectedBallId] = useState(null); // Stable selection by id
    const [isPaused, setIsPaused] = useState(false);
    const [didWin, setDidWin] = useState(false);
    const [didLose, setDidLose] = useState(false);
    const isGameOver = didWin || didLose;
    // Campaign sequence: wire levels in order of index for a progression
    const campaignIds = React.useMemo(() => {
        // Take the first 6 defined campaign levels in registry order for a full campaign
        return GAME_LEVELS
            .slice()
            .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
            .filter(l => ['gravityGauntlet', 'bulletHell'].includes(l.type))
            .slice(0, 6)
            .map(l => l.id);
    }, []);
    const currentCampaignIdx = React.useMemo(() => campaignIds.indexOf(currentLevelId), [campaignIds, currentLevelId]);
    const nextLevelId = React.useMemo(() => (currentCampaignIdx >= 0 && currentCampaignIdx < campaignIds.length - 1) ? campaignIds[currentCampaignIdx + 1] : null, [campaignIds, currentCampaignIdx]);
    const [showGauntletHelp, setShowGauntletHelp] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');
    const [fpsLimit, setFpsLimit] = useState(() => {
        try { const raw = localStorage.getItem(LS_KEYS.fpsLimit); if (raw != null) return JSON.parse(raw); } catch {}
        return 0; // Off by default
    });
    const [musicOn, setMusicOn] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_KEYS.musicOn);
            if (raw != null) return JSON.parse(raw);
            // If no preference, default ON regardless of mode
            return true;
        } catch { return true; }
    });
    const [musicVolume, setMusicVolume] = useState(() => {
        try { const raw = localStorage.getItem(LS_KEYS.musicVolume); if (raw != null) return JSON.parse(raw); } catch {}
        return 0.08; // default audible volume
    });
    const [musicMuted, setMusicMuted] = useState(() => {
        try { const raw = localStorage.getItem(LS_KEYS.musicMuted); if (raw != null) return JSON.parse(raw); } catch {}
        return false;
    });
    // Multi-BGM tracks: array of booleans (per-track enabled); track ids are indices 0..N-1
    const [bgmTracks, setBgmTracks] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_KEYS.bgmTracks);
            if (raw != null) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    // Clamp to allowed bounds and coerce booleans
                    const clamped = arr.slice(0, 10).map(v => !!v);
                    // Lower bound: allow empty (0 tracks)
                    return clamped;
                }
            }
        } catch {}
        // Default to one logical track present but not necessarily playing; align with musicOn
        return [true];
    });
    // Per-track gains (0..1), multiplied by global musicVolume (0..0.5)
    const [bgmTrackGains, setBgmTrackGains] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_KEYS.bgmTrackGains);
            if (raw != null) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    return arr.slice(0, 10).map(v => {
                        const n = Number(v);
                        return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
                    });
                }
            }
        } catch {}
        return [];
    });
    const [sfxVolume, setSfxVolume] = useState(() => {
        try { const raw = localStorage.getItem(LS_KEYS.sfxVolume); if (raw != null) return JSON.parse(raw); } catch {}
        return 0.25;
    });
    const [sfxMuted, setSfxMuted] = useState(() => {
        try { const raw = localStorage.getItem(LS_KEYS.sfxMuted); if (raw != null) return JSON.parse(raw); } catch {}
        return false;
    });
    // Named BGM Songs: dictionary { name: boolean[] } and selected song name
    const [bgmSongs, setBgmSongs] = useState(() => {
        const obj = loadJSON(LS_KEYS.bgmSongs, null);
        return (obj && typeof obj === 'object') ? obj : {};
    });
    const [selectedBgmSong, setSelectedBgmSong] = useState(() => {
        const name = loadJSON(LS_KEYS.bgmSelectedSong, '');
        return typeof name === 'string' ? name : '';
    });
    // Always enable sound engine; manage music/SFX via their own controls
    useEffect(() => {
        Sound.setEnabled(true);
    }, []);

    // Background music lifecycle: start/stop and persist preference
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.musicOn, JSON.stringify(musicOn)); } catch {}
        const baseVol = musicMuted ? 0 : musicVolume;
        // For each track id, start/stop depending on global musicOn and per-track toggle
        if (!musicOn) {
            try { Sound.stopAllBgm(); } catch {}
        } else {
            bgmTracks.forEach((on, id) => {
                if (on) {
                    const trackVol = baseVol * (bgmTrackGains[id] ?? 1);
                    Sound.startBgm(id, { volume: trackVol });
                } else {
                    Sound.stopBgm(id);
                }
            });
        }
    }, [musicOn, musicVolume, musicMuted, bgmTracks, bgmTrackGains]);

    // Persist and apply runtime BGM volume changes (all tracks)
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.musicVolume, JSON.stringify(musicVolume)); } catch {}
        const baseVol = musicMuted ? 0 : musicVolume;
        bgmTracks.forEach((on, id) => {
            const trackVol = baseVol * (bgmTrackGains[id] ?? 1);
            Sound.setBgmVolume(id, trackVol);
        });
    }, [musicVolume, musicMuted, bgmTracks, bgmTrackGains]);

    // Persist music mute preference
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.musicMuted, JSON.stringify(musicMuted)); } catch {}
        const baseVol = musicMuted ? 0 : musicVolume;
        bgmTracks.forEach((on, id) => {
            const trackVol = baseVol * (bgmTrackGains[id] ?? 1);
            Sound.setBgmVolume(id, trackVol);
        });
    }, [musicMuted, musicVolume, bgmTracks, bgmTrackGains]);

    // Persist BGM tracks
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.bgmTracks, JSON.stringify(bgmTracks)); } catch {}
    }, [bgmTracks]);
    // Persist per-track gains and align length with tracks
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.bgmTrackGains, JSON.stringify(bgmTrackGains)); } catch {}
    }, [bgmTrackGains]);
    useEffect(() => {
        setBgmTrackGains(prev => {
            let next = prev.slice(0, Math.min(10, bgmTracks.length));
            while (next.length < bgmTracks.length && next.length < 10) next.push(1);
            return next;
        });
    }, [bgmTracks]);

    // Persist songs and selected song
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.bgmSongs, JSON.stringify(bgmSongs)); } catch {}
    }, [bgmSongs]);
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.bgmSelectedSong, JSON.stringify(selectedBgmSong)); } catch {}
    }, [selectedBgmSong]);

    // Song handlers
    const saveBgmSong = useCallback((name) => {
        const trimmed = String(name || '').trim();
        if (!trimmed) return false;
        // Store a shallow copy of current config (coerced booleans, clamped to 10)
        const snapshot = (Array.isArray(bgmTracks) ? bgmTracks.slice(0, 10).map(v => !!v) : []);
        setBgmSongs(prev => ({ ...prev, [trimmed]: snapshot }));
        setSelectedBgmSong(trimmed);
        return true;
    }, [bgmTracks]);

    const loadBgmSong = useCallback((name) => {
        if (!name || !bgmSongs[name]) return false;
        const arr = Array.isArray(bgmSongs[name]) ? bgmSongs[name] : [];
        // Apply to state; side-effects in bgmTracks effect will start/stop tracks accordingly
        setBgmTracks(arr.slice(0, 10).map(v => !!v));
        setSelectedBgmSong(name);
        return true;
    }, [bgmSongs]);

    const deleteBgmSong = useCallback((name) => {
        if (!name) return false;
        setBgmSongs(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
        if (selectedBgmSong === name) setSelectedBgmSong('');
        return true;
    }, [selectedBgmSong]);

    const addBgmTrack = useCallback(() => {
        setBgmTracks(prev => {
            if (prev.length >= 10) return prev;
            // Default new track OFF; user can toggle per-track
            return [...prev, false];
        });
        setBgmTrackGains(prev => (prev.length >= 10 ? prev : [...prev, 1]));
    }, []);
    const removeBgmTrack = useCallback(() => {
        setBgmTracks(prev => {
            if (prev.length <= 0) return prev;
            const newArr = prev.slice(0, prev.length - 1);
            const removedId = prev.length - 1;
            // Stop the removed track if playing
            try { Sound.stopBgm(removedId); } catch {}
            return newArr;
        });
        setBgmTrackGains(prev => (prev.length > 0 ? prev.slice(0, prev.length - 1) : prev));
    }, []);
    const toggleBgmTrack = useCallback((id) => {
        setBgmTracks(prev => {
            if (id < 0 || id >= prev.length) return prev;
            const next = [...prev];
            next[id] = !next[id];
            // Immediate side-effect: start/stop this track according to global musicOn and new value
            const baseVol = musicMuted ? 0 : musicVolume;
            const gain = bgmTrackGains[id] ?? 1;
            if (musicOn && next[id]) {
                try { Sound.startBgm(id, { volume: baseVol * gain }); } catch {}
            } else {
                try { Sound.stopBgm(id); } catch {}
            }
            return next;
        });
    }, [musicOn, musicMuted, musicVolume, bgmTrackGains]);

    const setBgmTrackGain = useCallback((id, value) => {
        setBgmTrackGains(prev => {
            const n = Number(value);
            const clamped = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
            if (id < 0 || id >= Math.max(prev.length, bgmTracks.length)) return prev;
            const next = prev.slice();
            while (next.length < bgmTracks.length) next.push(1);
            next[id] = clamped;
            return next;
        });
        const baseVol = musicMuted ? 0 : musicVolume;
        try { Sound.setBgmVolume(id, baseVol * (Number(value) || 0)); } catch {}
    }, [bgmTracks.length, musicMuted, musicVolume]);

    // Bulk controls: mute/unmute all BGM track gains
    const muteAllBgmTracks = useCallback(() => {
        setBgmTrackGains(() => {
            const len = Math.min(10, Math.max(0, bgmTracks.length));
            return Array.from({ length: len }, () => 0);
        });
        const baseVol = 0; // muting sets effective volume to zero
        bgmTracks.forEach((on, id) => {
            try { Sound.setBgmVolume(id, baseVol); } catch {}
        });
    }, [bgmTracks]);
    const unmuteAllBgmTracks = useCallback(() => {
        setBgmTrackGains(() => {
            const len = Math.min(10, Math.max(0, bgmTracks.length));
            return Array.from({ length: len }, () => 1);
        });
        const baseVol = musicMuted ? 0 : musicVolume;
        bgmTracks.forEach((on, id) => {
            try { Sound.setBgmVolume(id, baseVol * 1); } catch {}
        });
    }, [bgmTracks, musicMuted, musicVolume]);

    // Persist and apply SFX prefs
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.sfxMuted, JSON.stringify(sfxMuted)); } catch {}
        Sound.setSfxMuted(sfxMuted);
    }, [sfxMuted]);
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.sfxVolume, JSON.stringify(sfxVolume)); } catch {}
        Sound.setSfxVolume(sfxVolume);
    }, [sfxVolume]);
    // Persist FPS limit
    useEffect(() => {
        try { localStorage.setItem(LS_KEYS.fpsLimit, JSON.stringify(fpsLimit)); } catch {}
    }, [fpsLimit]);
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
            timeLimitSec: sel.timeLimitSec,
            iFrameMs: sel.iFrameMs,
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
            // TODO: move keys to constants/config
            const handledKeys = new Set([' ', 'Spacebar', 'w', 'p', 'r', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 'a', 'd', 's', 'c']);
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
                ? loadJSON(LS_KEYS.settingsGameMode, null)
                : loadJSON(LS_KEYS.settingsSandbox, null);
            const next = mergeDefaultsForMode(newMode, saved);
            setPhysicsSettings(next);
            // If switching into game mode, show instructions unless dismissed before
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
    const liveVelXRef = React.useRef(0); // instantaneous velX from Canvas callback
    const lastMotionDirRef = React.useRef(0); // track last non-zero X direction
    const movementRafRef = React.useRef(null);

    useEffect(() => {
    const currentLevelType = physicsSettings?.level?.type;
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
            // Jump on Space or W or ArrowUp; keep P as pause key
            if (k === ' ' || event.code === 'Space' || k === 'w' || k === 'ArrowUp') {
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

            // Immediate slam keys: allowed in sandbox and Bullet Hell; blocked in Gauntlet
            if ((k === 's' || k === 'ArrowDown') && (!levelMode || currentLevelType === 'bulletHell')) {
                event.preventDefault();
                canvasRef.current?.slamPlayer?.();
                return;
            }

            // Track movement keys while held
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift']);
            if (moveKeys.has(k)) {
                // Always allow WASD movement
                event.preventDefault();
                keysDownRef.current.add(k);
                if (k === 'w' || k === 'ArrowUp') {
                    handleJump();
                } else if (k === 's') {
                    // handled above for sandbox; ignore here in gauntlet
                } else if (k === 'ArrowDown') {
                    // handled above for sandbox; ignore here in gauntlet
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
            const moveKeys = new Set(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift']);
            if (moveKeys.has(k)) {
                event.preventDefault();
                keysDownRef.current.delete(k);
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
                const hasLeft = (keys.has('a') || keys.has('ArrowLeft'));
                const hasRight = (keys.has('d') || keys.has('ArrowRight'));
                const boosting = keys.has('Shift');

                // Tunables from selected ball (with sensible defaults)
                const ct = selectedBall.controlTuning || {};
                const baseMaxSpeed = ct.maxSpeedBase ?? 2.0;         // px/frame
                const boostMultiplier = ct.boostMultiplier ?? 2.0;    // boost
                const accelRate = ct.accelRate ?? 0.35;               // px/frame^2
                const accelBoostMultiplier = ct.accelBoostMultiplier ?? 1.4;
                const epsilon = 0.03;

                const maxSpeedX = boosting ? baseMaxSpeed * boostMultiplier : baseMaxSpeed;
                const effectiveAccelX = boosting ? accelRate * accelBoostMultiplier : accelRate;

                // Determine desired direction; neutral if both or neither
                let dirX = 0;
                if (hasLeft && !hasRight) dirX = -1;
                else if (hasRight && !hasLeft) dirX = 1;
                else dirX = 0; // neutral when both held

                const currentVX = typeof liveVelXRef.current === 'number' ? liveVelXRef.current : selectedBall.velX;
                const targetVX = dirX === 0 ? currentVX : dirX * maxSpeedX;

                const moveTowards = (current, target, delta) => {
                    if (current < target) return Math.min(current + delta, target);
                    if (current > target) return Math.max(current - delta, target);
                    return current;
                };

                let newVX = currentVX;
                if (dirX !== 0) {
                    newVX = moveTowards(currentVX, targetVX, effectiveAccelX);
                    if (Math.abs(newVX) < epsilon) newVX = 0;
                } else {
                    // neutral: coast
                    newVX = currentVX;
                }

                const changedX = Math.abs(newVX - currentVX) > 1e-3;
                if (changedX) {
                    canvasRef.current?.updateSelectedBall?.({ id: selectedBall.id, velX: newVX });
                }
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
    }, [selectedBall, levelMode, setGlobalScore, isGameOver, handleJump, refreshLevelFromRegistry, physicsSettings?.level?.type]);

    // Persist current level id
    useEffect(() => {
    try { localStorage.setItem(LS_KEYS.currentLevelId, JSON.stringify(currentLevelId)); } catch (e) { /* noop */ void 0; }
    }, [currentLevelId]);

    // Preset handlers removed

    const handlePhysicsSettingsChange = useCallback((newSettings) => {
        // Let Canvas reconcile ball count/size/speed internally.
        setPhysicsSettings(newSettings);
    }, []);

    const handleResetToDefaults = useCallback(() => {
        const defaults = levelMode ? GAME_MODE_DEFAULTS : DEFAULTS;
        setPhysicsSettings(defaults);
        // Clear saved settings for this mode to avoid reloading old values later
    try {
            localStorage.removeItem(levelMode ? LS_KEYS.settingsGameMode : LS_KEYS.settingsSandbox);
    } catch (e) { /* noop */ void 0; }
    }, [levelMode]);

    // Persist settings whenever they change (per mode)
    useEffect(() => {
        const key = levelMode ? LS_KEYS.settingsGameMode : LS_KEYS.settingsSandbox;
        try {
            // In level mode, avoid persisting the level definition so code/registry updates remain authoritative
            const toSave = levelMode ? { ...physicsSettings } : physicsSettings;
            if (levelMode) delete toSave.level;
            localStorage.setItem(key, JSON.stringify(toSave));
        } catch (e) { /* noop */ void 0; }
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
            timeLimitSec: sel.timeLimitSec,
            iFrameMs: sel.iFrameMs,
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
        // Stop any pending auto-advance to prevent race conditions
        setDidWin(false);
        setDidLose(false);
        setShowGauntletHelp(false);
        
        // Use setTimeout to ensure state changes are processed before reset
        setTimeout(() => {
            refreshLevelFromRegistry();
            canvasRef.current?.resetBalls?.();
            setGlobalScore(0);
            setScoredBallsCount(0);
            setRemovedBallsCount(0);
            try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
        }, 16); // Single frame delay to ensure UI updates
    }, [refreshLevelFromRegistry]);

    const handleAdvanceToNextLevel = useCallback(() => {
        if (!nextLevelId) return;
        
        // Immediately clear win state to prevent double-triggering
        setDidWin(false);
        setDidLose(false);
        setShowGauntletHelp(false);
        
        // Change level selection
        setCurrentLevelId(nextLevelId);
        
        // Reset game state after level change
        setTimeout(() => {
            refreshLevelFromRegistry();
            canvasRef.current?.resetBalls?.();
            setGlobalScore(0);
            setScoredBallsCount(0);
            setRemovedBallsCount(0);
            try { localStorage.setItem(LS_KEYS.gauntletInstructionsDismissed, JSON.stringify(true)); } catch (e) { /* noop */ void 0; }
        }, 16); // Single frame delay to ensure level change is processed
    }, [nextLevelId, refreshLevelFromRegistry]);

    // Auto-advance after a short win toast when a next level exists
    useEffect(() => {
        if (!levelMode) return;
        if (!didWin) return;
        if (!nextLevelId) return;
        
        // Only auto-advance if the win state has been stable for the timeout period
        const tid = setTimeout(() => {
            // Double-check that we're still in win state and haven't been reset
            if (didWin && nextLevelId && levelMode) {
                handleAdvanceToNextLevel();
            }
        }, 1200);
        
        return () => clearTimeout(tid);
    }, [didWin, nextLevelId, levelMode, handleAdvanceToNextLevel]);

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
            <StatusBar uiOpacity={physicsSettings.visuals.uiOpacity} levelMode={levelMode} level={physicsSettings.level} isPaused={isPaused} />
            <GameControlsPanel
                uiOpacity={physicsSettings.visuals.uiOpacity}
                levelMode={levelMode}
                onResetGauntlet={handleResetGauntlet}
                onShowInstructions={() => setShowGauntletHelp(true)}
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
                        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>You won!</div>
                        {nextLevelId ? (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="button button--primary" onClick={handleAdvanceToNextLevel} aria-label="Next Level">Next Level ▶</button>
                                <button className="button" onClick={handleResetGauntlet} aria-label="Replay Level">Replay</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="button button--primary" onClick={handleResetGauntlet}>Play Again</button>
                            </div>
                        )}
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
                <GameInstructionsOverlay
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
                isPaused={isPaused}
                level={physicsSettings.level}
                setScoredBallsCount={setScoredBallsCount}
                setRemovedBallsCount={setRemovedBallsCount}
                ballCount={physicsSettings.ballCount}
                ballSize={physicsSettings.ballSize}
                ballShape={physicsSettings.ballShape}
                applyShapeToExisting={!!physicsSettings.applyShapeToExisting}
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
                fpsLimit={fpsLimit}
                isInvincible={isInvincible}
            />
            {/* Lightweight HUD: show active powerups on the player with countdowns */}
            {levelMode && selectedBall && <HUDPowerups selectedBall={selectedBall} />}
            <Controls
                physicsSettings={physicsSettings}
                onPhysicsSettingsChange={handlePhysicsSettingsChange}
                onAddBall={handleAddBall}
                onRemoveBall={handleRemoveBall}
                onResetBalls={handleResetBalls}
                levelMode={levelMode}
                toggleLevelMode={toggleLevelMode}
                onResetToDefaults={handleResetToDefaults}
                    fpsLimit={fpsLimit}
                    onFpsLimitChange={setFpsLimit}
                    musicOn={musicOn}
                    musicVolume={musicVolume}
                    musicMuted={musicMuted}
                    onMusicVolumeChange={setMusicVolume}
                    onToggleMusicMute={() => setMusicMuted((m) => !m)}
                    onToggleMusicOn={() => setMusicOn((on) => !on)}
                    bgmTracks={bgmTracks}
                    onAddBgmTrack={addBgmTrack}
                    onRemoveBgmTrack={removeBgmTrack}
                    onToggleBgmTrack={toggleBgmTrack}
                    bgmTrackGains={bgmTrackGains}
                    onSetBgmTrackGain={setBgmTrackGain}
                    bgmSongs={bgmSongs}
                    selectedBgmSong={selectedBgmSong}
                    onSaveBgmSong={saveBgmSong}
                    onLoadBgmSong={loadBgmSong}
                    onDeleteBgmSong={deleteBgmSong}
                    onSelectBgmSong={setSelectedBgmSong}
                    onMuteAllBgmTracks={muteAllBgmTracks}
                    onUnmuteAllBgmTracks={unmuteAllBgmTracks}
                    sfxVolume={sfxVolume}
                    sfxMuted={sfxMuted}
                    onSfxVolumeChange={setSfxVolume}
                    onToggleSfxMute={() => setSfxMuted((m) => !m)}
                />
            <SelectedBallControls
                selectedBall={selectedBall}
                onUpdateSelectedBall={handleUpdateSelectedBall}
            />
        </div>
    );
}

export default App;