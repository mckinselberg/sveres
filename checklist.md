## Checklist (grouped by code impact)

### Low impact

- [DONE] Remove Presets from Physics panel
  - Acceptance: Presets UI removed from `Controls.jsx`; no dead imports/props; lint/typecheck clean. Verified by lint/typecheck/test/build.
- Add a tiny e2e smoke test to verify `ui:showControls` toggles visibility and persists across reloads
  - [DONE] Acceptance: Test toggles visibility, reloads, asserts persisted state; runs headless in CI; default respects localStorage. Added `test/ui.showControls.e2e.test.js` and verified.
- Input polish: add W as jump alias; ensure capture-phase preventDefault doesn’t block input fields
  - Acceptance: Pressing 'w' jumps like Space/J; typing in inputs unaffected; unit test covers alias and non-blocking behavior.
- Add a subtle on-screen hint when controls are hidden (e.g., pulse on gear after idle) to aid discoverability
  - [DONE] Acceptance: Gear pulses after ~10s idle when hidden; stops on hover/focus/click; respects `prefers-reduced-motion`. Implemented in `App.jsx` with CSS in `styles/App.scss`.

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
  - `src/components/ColorSchemeManager.jsx`
  - `src/components/PhysicsSettingsManager.jsx`

Game Polish

- have health bars match parent shape within objects.
- have balls do a "pop" animation and accompanying sound, then remove from the ui

UI Polish

- [DONE] fix the shape dropdown so that it doesn't change all the shapes to the one specified unless a checkmark is checked
  - Acceptance: Added checkbox in Controls; Canvas gates re-seeding; added unit test `test/shape.applyToExisting.test.js`.

UX Polish

- improve wasd/nmj logic
