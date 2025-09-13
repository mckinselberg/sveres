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
- Organize overlays/panels
  - Acceptance: Z-index/layers correct; keyboard navigation works; no overlay blocks unintended clicks; mobile layout verified.

### High impact

- Organize UI layout per modern game conventions and hide advanced controls behind details toggles
  - Acceptance: Controls grouped logically; advanced options behind details/accordion; state persists; no settings regressions.
- Welcome screen
  - Acceptance: First-run screen shown until dismissed; dismissal persisted; does not steal focus post-close; accessible labels/contrast.

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

- enable ability to start multiple bgm tracks
- dynamic BGM intensity (react to game state via filters/volume; e.g., hazards, near-misses)
- pause/resume smoothing (short fades and subtle filter sweeps to avoid abrupt transitions)
- per-level themes/playlist with crossfade on level switch
- volume ducking when important SFX play (win/lose, hazard impact)
- music hotkeys and hints (mute/volume shortcuts, overlay tooltip hints)

## Game Levels

- bullet hell - last 1 minute in bullet hell to proceed
- slam - destroy the target balls by using the slam (down arrow) to attack them

## Let's come back to this

Add a tiny helper to toggle aria-hidden on the main app while any dialog is open (optional).
Do a quick manual check on mobile (Chrome dev tools emulator) for tab order and dismissal affordances.
Move on to the WASD test stabilization once you’re satisfied with overlays.
