Here’s how I’d continue decomposing `Canvas.jsx` without changing behavior, in small, low‑risk steps.

Checklist:

- Extract pure helpers (rendering/positioning) out of Canvas/physics
- Extract small, focused hooks for loop, sizing, and input bridging
- Keep Canvas’s public ref API stable (jumpPlayer, updateSelectedBall, resetBalls, etc.)
- Add minimal tests where behavior becomes pure

Recommended steps:

1. Pure render/position utilities

- Move shape drawing helpers and path math to `src/utils/canvasRendering.js`:
  - drawCircle, drawRect, drawStaticShape, drawPowerup
- Move `resolveLevelPos` out of `physics.jsx` to `src/utils/levelPositioning.js` and import from there (add unit tests for anchors/center+offset).

2. Resolved statics hook

- Add `src/hooks/useResolvedStatics.js`:
  - Input: level, canvasWidth, canvasHeight
  - Output: resolvedHazards/goals/powerups arrays and a flattened preResolvedStatics for collisions
  - This removes the per-frame resolution code from `physics.loop` and keeps it memoized.

3. Game loop and RAF

- Add `src/hooks/useGameLoop.js` that encapsulates requestAnimationFrame and pause handling:
  - Input: a tick callback, paused flag
  - Output: start/stop or it just runs the callback while mounted
  - Canvas uses it to call the single “engine step” function.

4. Bullet hell spawner

- Extract to `src/js/modes/bulletHellSpawner.js`:
  - pure function spawnBulletIfNeeded(ctxMeta, player, settings, now) -> bullet|null
  - Imported by the loop; simplifies physics file and improves testability.

5. Powerup pickups

- Extract to `src/utils/powerups.js`:
  - applyPowerupPickups(balls, level, resolvedPowerups, selectedBall, now, Sound)
  - Keeps side effects in one place; current Canvas HUD already reads from selectedBall.

6. Jump mechanics inside Canvas

- Add `src/hooks/useJumpMechanics.js`:
  - Encapsulate the double-jump token, cooldowns, and apply jump impulse to the controlled ball
  - Canvas’s imperative `jumpPlayer()` just calls into this hook.

7. Canvas sizing and DPR

- Add `src/hooks/useCanvasSize.js`:
  - Handle resize observers/DPR scaling and expose width/height/devicePixelRatio
  - Keeps the draw buffer setup out of Canvas’s body.

8. Imperative API wrapper

- Add `src/hooks/useImperativeCanvasAPI.js`:
  - Wraps updateSelectedBall, resetBalls, addBall, removeBall, applyColorScheme, jumpPlayer, etc.
  - Keeps the ref handling cohesive and easier to test.

9. Tests

- Add unit tests:
  - `levelPositioning.test.js` for anchors/percent/center offsets
  - `powerups.test.js` for pickup application and shield consumption edge case
  - `bulletHellSpawner.test.js` for spawn cadence and direction

Order of operations to minimize risk:

- 1 and 2 (pure helpers + resolved statics) first
- 3 and 4 (loop + spawner)
- 5 (powerups)
- 6–8 (hooks consolidating Canvas internals)
- 9 (tests as you extract)

Public contracts to keep stable:

- Props currently received by `Canvas`
- Imperative ref methods: jumpPlayer, updateSelectedBall, resetBalls, addBall, removeBall, applyColorScheme, onSelectedBallMotion callback shape

If you want, I can start with steps 1–2 (pure helpers + resolved statics) and wire them, then run tests and report deltas.

- welcome screen
- organize
- add wasd controls
- debounce/throttle sounds
- mute button
- create music using the same simple bleep/bloops
