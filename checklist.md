Here’s what remains after decomposing `Canvas.jsx`. Next steps are prioritized to maximize stability and quality.

Top priority (bugs)

- Investigate and fix reset issue where balls keep speeding up, leading to a freeze.
  - Hypotheses: duplicate RAF after reset; gravity/velocity scaling compounded on reseed; state leakage across resets (e.g., friction/drag disabled, sleep flags).
  - Repro plan: reset repeatedly in game mode; watch RAF count and per-frame entity counts; profile CPU usage.

High priority

- Tests
  - test/levelPositioning.test.js — anchors/percent/center offsets
  - test/powerups.test.js — pickups and shield consumption edge cases
  - test/bulletHellSpawner.test.js — spawn cadence and direction

Medium priority

- Input polish: add WASD controls (W as jump alias)
- Canvas/responsiveness: re-apply DPR sizing/backing-store scaling on viewport/devicePixelRatio changes

Low priority (UX polish)

- Welcome screen
- Organize overlays/panels
- Simple bleep/bloop background music with a UI toggle
- FPS cap/control in settings
- organize the ui elements logically, using established design conventions from modern games

Later

- In game mode, define behavior when the player does not interact with the canvas at app start (e.g., attract/demo mode or paused prompt)

Public contracts to keep stable

- Props currently received by `Canvas`
- Imperative ref methods: jumpPlayer, updateSelectedBall, resetBalls, addBall, removeBall, applyColorScheme
- onSelectedBallMotion callback shape
