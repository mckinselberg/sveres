Here’s what remains after decomposing `Canvas.jsx`. Next steps are prioritized to maximize stability and quality.

Top priority (bugs)

- Fix behavior for on/off states for "Propagate Player Speed Boost to All Balls" physics settings and add unit tests
- Fixed: canvas jank (remove timer churn and animation spam)
  - Replaced setTimeout hazard flashes with timestamp-based flash flag to avoid per-collision timers.
  - Added per-ball deformation cooldown (~80ms) to limit GSAP timeline spam during rapid collisions.
  - Sound already throttled and voice-limited; left as-is.
  - Eliminated per-frame DOM reads for controls panel rect; Controls/App publish width/visibility into shared state read by the loop.
- Fixed: duplicate RAF/reset freeze and runaway speed after reset (guard RAF, stop-before-reseed, clean restart).
- Fixed: player speed-up unintentionally speeding other balls; added optional toggle to enable it as a feature.
- Fixed: canvas jank during settings changes by throttling controls rect reads and debouncing settings persistence.
- Fixed: gear toggle not showing controls — controls panel had inline position overriding fixed; restored fixed positioning so it renders above canvas, added keyboard 'C' toggle, and refocus-canvas on gear click. LocalStorage key `ui:showControls` is read/written and now reflected in UI.

High priority

- Make linting part of the verification step
- Tests: added and passing
  - levelPositioning — anchors/percent/center offsets
  - powerups — shield/shrink pickups and countdowns
  - bulletHellSpawner — cadence and direction
  - propagateSpeed — propagation toggle off/on behavior

Medium priority

- Input polish: add WASD controls (W as jump alias)
- Canvas/responsiveness: re-apply DPR sizing/backing-store scaling on viewport/devicePixelRatio changes
- Performance: skip panel collisions while sliders are dragged (implemented via `uiDragState`)
- Add a tiny e2e smoke test to verify `ui:showControls` toggles visibility and persists across reloads

Low priority (UX polish)

- Welcome screen
- Organize overlays/panels
- Organize the UI elements logically, using established design conventions from modern games
- Simple bleep/bloop background music with a UI toggle
- FPS cap/control in settings
- Remove Presets from Physics panel

Later

- In game mode, define behavior when the player does not interact with the canvas at app start (e.g., attract/demo mode or paused prompt)

Public contracts to keep stable

- Props currently received by `Canvas`
- Imperative ref methods: jumpPlayer, updateSelectedBall, resetBalls, addBall, removeBall, applyColorScheme
- onSelectedBallMotion callback shape

Proposed next steps

1. DPR/reactive resize polish

- Handle devicePixelRatio changes (zoom/retina switches) and window resize with a cheap debounce; re-run canvas backing-store sizing and transform.
- Add a small smoke test to verify no skew/blur when DPR toggles.

2. Input polish

- Add W as jump alias; ensure capture-phase preventDefault doesn’t block input fields.
- Expand tests for jump mechanics and input direction edge cases.

3. Performance micro-optimizations

- Short-circuit panel-collision math entirely when the controls panel is off-screen.
- Defer color scheme application across frames for large ball counts (chunked updates).
- Add e2e/UI test to cover gear button and 'C' keyboard toggle, asserting `ui:showControls` persistence.

4. UX improvements

- Organize UI layout per modern game conventions and hide advanced controls behind details toggles.
- Add a subtle on-screen hint when controls are hidden (e.g., pulse on gear after idle) to aid discoverability.

5. Stability guardrails

- Add a dev-only watchdog that asserts only one RAF is active after resets/mode toggles.
