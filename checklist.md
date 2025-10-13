## Checklist (grouped by code impact)

### Low impact

- [DONE] Remove Presets from Physics panel
  - Acceptance: Presets UI removed from `Controls.jsx`; no dead imports/props; lint/typecheck clean. Verified by lint/typecheck/test/build.
- Add a tiny e2e smoke test to verify `ui:showControls` toggles visibility and persists across reloads
  - [DONE] Acceptance: Test toggles visibility, reloads, asserts persisted state; runs headless in CI; default respects localStorage. Added `test/ui.showControls.e2e.test.js` and verified.
- [DONE] Input polish: add W as jump alias; ensure capture-phase preventDefault doesn’t block input fields; add S as slam (sandbox-only)
  - Acceptance: Pressing 'w' jumps like Space/J; typing in inputs unaffected; unit tests cover alias and non-blocking behavior. 's' triggers downward slam only in sandbox; disabled in gauntlet.
- Add a subtle on-screen hint when controls are hidden (e.g., pulse on gear after idle) to aid discoverability

  - [DONE] Acceptance: Gear pulses after ~10s idle when hidden; stops on hover/focus/click; respects `prefers-reduced-motion`. Implemented in `App.jsx` with CSS in `styles/App.scss`.

- [DONE] Keyboard shortcut: 'C' toggles Controls panel visibility

  - Acceptance: Pressing 'c' toggles the Controls panel regardless of focus (excluding inputs); matches the gear tooltip; respects capture-phase preventDefault and reduced motion pulse remains disabled while visible.

- [DONE] Gameplay toggle: Pop + Despawn on Remove
  - Acceptance: New checkbox in Controls bound to `physicsSettings.gameplay.popDespawnEnabled` (persisted). Toggling updates Canvas/physics immediately without reload.
- [DONE] Canvas Remove Ball respects toggle
  - Acceptance: When toggle is off, Remove Ball is a no-op (ball remains). When on, ball pops with sound/animation and is removed. Behavior verified in browser; in tests, pop completes immediately for determinism.

### Medium impact

- [DONE] Performance: skip panel collisions while sliders are dragged (via `uiDragState`)
  - Acceptance: During slider drag, panel-collision logic is bypassed; FPS remains stable; unit test asserts drag-flag short-circuit.
- [DONE] Canvas/responsiveness: re-apply DPR sizing/backing-store scaling on viewport/devicePixelRatio changes
  - Acceptance: After resize/DPR change, canvas is crisp (no blur/skew); no memory leaks; smoke test or manual steps documented.
  - Verified: DPR-aware sizing with context scale in `Canvas.jsx`; jsdom-safe stub to keep tests green; suite passes (1 skipped) and production build succeeds.
- [DONE] Background music with overlay controls (enable, volume, mute) — consolidated audio UX

  - Acceptance: Looping BGM starts automatically in all modes (autoplay-safe: starts after first gesture if blocked). Controls live in the overlay panel only: Enable Music (checkbox), Music Volume slider (0–50%), and Mute toggle. All settings persisted (`ui:musicOn`, `ui:musicVolume`, `ui:musicMuted`). Removed duplicate Music button from the right-side game panel. Verified by `test/bgm.api.safe.test.js` and manual checks; no console errors.

- [DONE] SFX controls & audio consolidation (remove global Sound toggle)
  - Acceptance: SFX has Enable (mute toggle) and Volume slider (0–100%) in the overlay Audio section; persisted via `ui:sfxMuted` and `ui:sfxVolume`. Global Sound toggle removed from UI and app state; audio engine is always enabled, while Music/SFX paths are controlled independently. Right-side game panel has no audio controls. Tests remain green (1 skipped).
- [DONE] FPS cap/control in settings
  - Acceptance: Cap reduces render/update cadence while physics stays stable; can be disabled; simple on-screen FPS badge confirms rate. Includes presets (Off/30/60/120) and a Custom numeric input (1–240). Persisted via `ui:fpsLimit`.
- [DONE] Organize overlays/panels
  - Acceptance: Z-index/layers correct; keyboard navigation works; no overlay blocks unintended clicks; mobile layout verified.
  - Implemented: Both Controls and SelectedBall panels are now collapsible by clicking titles; consistent UI patterns; removed old gear toggle button; updated help text.

### High impact

- [DONE] Organize UI layout per modern game conventions and hide advanced controls behind details toggles
  - Acceptance: Controls grouped logically; advanced options behind details/accordion; state persists; no settings regressions.
  - Implemented: Both Controls and SelectedBall panels now collapsible; consistent interaction patterns; removed gear toggle system.
- Welcome screen
  - Acceptance: First-run screen shown until dismissed; dismissal persisted; does not steal focus post-close; accessible labels/contrast.
- Improve existing level balance and progression
  - Acceptance: Better hazard placement for skill progression; adjusted goal positions for strategic gameplay; balanced powerup distribution; smoother difficulty curves across levels.
- Add new level concepts and variety
  - Acceptance: New level archetypes like "Pinball Machine" gauntlet and "Corridor Run" bullet hell; creative hazard arrangements; diverse gameplay challenges beyond current patterns.
- Enhance powerup system with new types
  - Acceptance: New powerup types (ghost, magnet, bounce, gravity) with meaningful gameplay impact; interactive elements that add strategic depth; balanced spawn rates and effects.

### Later cleanup

- Remove unused components after presets removal
  - Re-evaluate first: both components were recently edited. Confirm current usage before deletion.
  - Candidates if unused:
    - `src/components/ColorSchemeManager.jsx`
    - `src/components/PhysicsSettingsManager.jsx`
- add linting for indentation, discuss how to enable eslint to automatically fix indentation

- Stabilize and unskip WASD Gauntlet test (low priority)

  - Acceptance: `test/wasd.gauntlet.movement.test.js` runs reliably in CI, asserting: D accelerates right (velX > 0), A accelerates left (velX < 0), A+D held is neutral (no new updates). Uses deterministic RAF/time mocking and avoids flakiness.

- Add resolution media query listener for DPR-only changes (low priority)

  - Acceptance: Canvas re-scales when devicePixelRatio changes without a window resize (e.g., monitor move/zoom). Implement via matchMedia resolution listeners or equivalent; manual steps documented.

- [DONE] Remove duplicate Music control from game panel
  - Acceptance: The Music toggle is removed from `GameControlsPanel`; music controls exist only in overlay `Controls` under Audio section. No broken props.

## a11y polish

- We don’t flip aria-hidden on the app root; current focus trap role/aria-modal is sufficient. If you want, I can add aria-hidden="true" to the app container when any overlay/modal is open.

## Game Polish

- update instructions for gauntlet mode
- rename Gravity Gauntlet mode to Gauntlet mode
- establish extensible registry system for modes and levels
- [DONE] have health bars match parent shape within objects.
  - Acceptance: Health bar outline matches object shape (circle/square/triangle/etc.). Implemented in Ball draw routines; visually verified; no perf regressions.
- [DONE] have balls do a "pop" animation and accompanying sound, then remove from the ui
  - Acceptance: `Ball.popAndDespawn(onComplete)` animates opacity/scale with GSAP in browser; in tests/non-browser, completes immediately. `sound.playPop()` triggered. No console errors.
- [DONE] sandbox: pop + despawn when health reaches zero, gated by toggle
  - Acceptance: With toggle on, dead balls pop and are removed post-collision sweep; with toggle off, dead balls remain on-canvas. Physics TS/JS paths agree; tests stable.

UI Polish

- [DONE] fix the shape dropdown so that it doesn't change all the shapes to the one specified unless a checkmark is checked
  - Acceptance: Added checkbox in Controls; Canvas gates re-seeding; added unit test `test/shape.applyToExisting.test.js`.
- [DONE] Compact icon buttons for BGM controls (add/remove/mute/unmute) to prevent layout wrapping.
- [DONE] Slider layout uses grid with non-wrapping value readouts to avoid overflow.

UX Polish

- remove nmj logic. fully debug and implement wasd logic
  - Note: Partially addressed (W jump alias; S slam sandbox-only). Remaining: clarify/implement nmj specifics.

## Proposed next steps

- [DONE] Tests: add targeted specs to assert no-op behaviors when pop/despawn toggle is off (Canvas Remove Ball, sandbox dead-ball sweep, hazard/goal branches).
  - Acceptance: All branches covered with deterministic, headless tests; pass reliably in CI.
    - Canvas remove no-op: `test/canvas.remove.noop.test.js`
    - Sandbox dead-balls no-op: `test/sandbox.deadballs.noop.test.js`
    - Goal removal without pop: `test/goal.noPop.remove.test.js`
    - Hazard removal without pop: `test/hazard.noPop.remove.test.js`
- UX: indicate Remove is disabled when toggle off (disable control or tooltip/subtle shake), and optionally add a quick “Clear dead balls” action when toggle is off.
  - [DONE] Acceptance: "Remove Ball" is disabled when the toggle is off and shows a helpful tooltip. Tests pass; optional polish (subtle shake, “Clear dead balls”) deferred.
- [DONE] Performance: bypass panel-collision work while sliders are dragged (uiDragState short-circuit) and profile FPS.
- Audio: simple background loop with a persisted toggle; ensure autoplay policy compliance (start on user gesture).
  - [DONE] Replaced by completed Background music feature above (enable, volume, mute; autoplay-safe; persisted; consolidated controls).
- FPS cap: add optional FPS limiter with clear on/off and a simple on-screen metric for verification.
  - [DONE] Implemented with presets and custom input; overlay badge shows current FPS and cap.
- Overlays: organize z-index/layers and keyboard navigation for panels/overlays; verify mobile layout.
- Welcome/Intro: refine first-run experience in `IntroOverlay.jsx` (labels/contrast/focus behavior) and persist dismissal.
- Cleanup: confirm whether `ColorSchemeManager.jsx` and `PhysicsSettingsManager.jsx` are still in active use; if not, remove plus update imports.

Additional nice-to-haves (Audio)

- [DONE] Add a tiny unit test to assert SFX mute/volume gating for `blip`/`noiseHit` in `utils/sound.js`.
- [DONE] Migrate/clean legacy localStorage key `ui:soundOn` (optional) and note in README.

## Music Enhancements

- [DONE] enable ability to start multiple bgm tracks
- dynamic BGM intensity (react to game state via filters/volume; e.g., hazards, near-misses)
- pause/resume smoothing (short fades and subtle filter sweeps to avoid abrupt transitions)
- per-level themes/playlist with crossfade on level switch
- volume ducking when important SFX play (win/lose, hazard impact)
- music hotkeys and hints (mute/volume shortcuts, overlay tooltip hints)
- [DONE] per-track gain sliders
- [DONE] playing-state indicator per track (LED/dot)
- “Save As…” to avoid overwriting the current song name
- include tempo/noteGain per song if/when exposed
- optional per-track pan for stereo width
- [DONE] quick “Mute All Tracks” button
- [DONE] Named “Songs” (save/load/delete) for BGM configuration with persistence
- [DONE] HMR-safe audio cleanup (stop all BGM on dispose; prevent duplicates)

## Game Levels

- [DONE] Mode framework scaffolding

  - Acceptance: Central registry for modes with lifecycle hooks; mode selection persisted; Canvas integrates mode-specific update hooks without breaking sandbox.
    - Implemented: Level registry system in `src/js/levels/levels.js` with configurable physics, goals, hazards, powerups
    - Added 6-level campaign progression (Gauntlet I-IV, Bullet Hell I-III) 
    - Renamed "Gravity Gauntlet Mode" to "Game Mode" to reflect diverse level types
    - Updated UI and constants throughout codebase

- Bullet Hell (survive 60s)

  - Acceptance: Player survives for 60 seconds while avoiding projectiles; losing all health ends the run; timer/HUD visible; deterministic spawns when `seed` is provided; performance holds 60 FPS on typical desktop.
    - Health: Reuse ball health bars; enable health depletion on hazard collision; clamp and pop on zero (uses existing pop+despawn).
    - Spawners: Implement pattern presets (arc sweep, ring burst, aimed burst, random drizzle) with a difficulty curve (spawn rate/speed increases at 15s/30s/45s).
    - Hazards: Use lightweight shapes (triangles/diamonds) with bounding-circle collisions; mark as hazard class for damage-only interactions; pool instances to avoid GC churn.
    - HUD: Add countdown timer (60→0), hearts/HP bar, and “Wave up” toasts at thresholds; pause overlay on win/lose.
    - Win/Lose: Win when timer reaches 0 with HP>0; Lose when HP<=0; show overlay with retry/quit; record best time in localStorage `progress:bulletHell:best`.
    - Tests: Unit test deterministic spawn with fixed `seed` and mocked time; collision reduces HP; win condition fires at 60s; lose triggers on HP<=0.

- Slam Attack (destroy targets with slam)

  - Acceptance: Down Arrow (and 'S') triggers a ground-slam that damages nearby target balls; destroy all targets within time limit to win; sandbox and gauntlet unaffected by slam unless this mode is active.
    - Input: Reuse existing slam binding; gate activation by mode; short cooldown (e.g., 600ms) and brief invulnerability window to prevent self-harm.
    - Targets: Spawn N target balls (configurable; default 10) with HP; optional patrol movement; marked as objectives, not hazards.
    - Slam Effect: Radial damage falloff; apply impulse/knockback; camera/Canvas screenshake; SFX: heavy blip + noiseHit; optional ripple via GSAP.
    - HUD: Show remaining targets, timer, and slam cooldown indicator; show tutorial hint on first entry.
    - Win/Lose: Win when all targets are destroyed before timer ends; Lose on timeout; persist best time/kills `progress:slam:best`.
    - Tests: Deterministic seed spawns same target positions; slam reduces HP within radius; win when count hits 0; cooldown respected.

- Integration & polish
  - Acceptance: Modes coexist with existing features (music, FPS cap, overlays) without regressions; audio reacts to intensity.
    - Audio: Hook dynamic BGM intensity (volume/filter) to hazard density/danger state; duck music slightly on slam.
    - UI: Add mode-specific instructions overlay; disable conflicting Controls while in a mode (e.g., shape-all dropdown) to prevent unintended reseeds.
    - Persistence: Save last selected mode and difficulty; provide quick retry button.
    - Performance: Cap concurrent hazards; object pooling; cheap math (avoid per-frame allocations). Profile with FPS badge.

## Let's come back to this

Add a tiny helper to toggle aria-hidden on the main app while any dialog is open (optional).
Do a quick manual check on mobile (Chrome dev tools emulator) for tab order and dismissal affordances.
Move on to the WASD test stabilization once you’re satisfied with overlays.

## Next Steps (Proposed)

- Unskip WASD Gauntlet test with deterministic RAF/time mocking; hide overlays; disable FPS cap during test.
- Add “Save As…” for Songs to avoid accidental overwrite; optionally prevent duplicate names.
- Per-track pan control (0–1) with persistence; apply to Web Audio panner when available.
- Optionally include tempo/noteGain in song snapshots to capture composition.
- Music hotkeys (mute/unmute, vol up/down) and a brief tooltip in Audio section.
- a11y: set `aria-hidden="true"` on app root when dialogs open (optional; current focus trap is sufficient).
- Docs: README updates for Multi-BGM, Songs, per-track gain, mute all, indicators.
