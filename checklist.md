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

- [DONE] Gameplay toggle: Pop + Despawn on Remove
  - Acceptance: New checkbox in Controls bound to `physicsSettings.gameplay.popDespawnEnabled` (persisted). Toggling updates Canvas/physics immediately without reload.
- [DONE] Canvas Remove Ball respects toggle
  - Acceptance: When toggle is off, Remove Ball is a no-op (ball remains). When on, ball pops with sound/animation and is removed. Behavior verified in browser; in tests, pop completes immediately for determinism.

### Medium impact

- Performance: skip panel collisions while sliders are dragged (via `uiDragState`)
  - Acceptance: During slider drag, panel-collision logic is bypassed; FPS remains stable; unit test asserts drag-flag short-circuit.
- Canvas/responsiveness: re-apply DPR sizing/backing-store scaling on viewport/devicePixelRatio changes
  - Acceptance: After resize/DPR change, canvas is crisp (no blur/skew); no memory leaks; smoke test or manual steps documented.
- Simple bleep/bloop background music with a UI toggle
  - Acceptance: Looping bgm with start/stop toggle; persisted; respects user gesture and autoplay rules; no console errors.
- FPS cap/control in settings
  - Acceptance: Cap reduces render/update cadence while physics stays stable; can be disabled; simple metric/log confirms rate.
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

Game Polish

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

- improve wasd/nmj logic
  - Note: Partially addressed (W jump alias; S slam sandbox-only). Remaining: clarify/implement nmj specifics.

## Proposed next steps

- Tests: add targeted specs to assert no-op behaviors when pop/despawn toggle is off (Canvas Remove Ball, sandbox dead-ball sweep, hazard/goal branches).
  - [STARTED] Added tests: `test/canvas.remove.noop.test.js`, `test/sandbox.deadballs.noop.test.js`. Pending: hazard/goal branches.
- UX: indicate Remove is disabled when toggle off (disable control or tooltip/subtle shake), and optionally add a quick “Clear dead balls” action when toggle is off.
  - [STARTED] Remove button is disabled with a tooltip when toggle is off.
- Canvas/responsiveness: implement crisp DPR scaling on resize/devicePixelRatio changes; add a tiny smoke test or manual checklist.
- Performance: bypass panel-collision work while sliders are dragged (uiDragState short-circuit) and profile FPS.
- Audio: simple background loop with a persisted toggle; ensure autoplay policy compliance (start on user gesture).
- FPS cap: add optional FPS limiter with clear on/off and a simple on-screen metric for verification.
- Overlays: organize z-index/layers and keyboard navigation for panels/overlays; verify mobile layout.
- Welcome/Intro: refine first-run experience in `IntroOverlay.jsx` (labels/contrast/focus behavior) and persist dismissal.
- Cleanup: confirm whether `ColorSchemeManager.jsx` and `PhysicsSettingsManager.jsx` are still in active use; if not, remove plus update imports.
