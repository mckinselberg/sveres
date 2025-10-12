# Copilot Instructions for AI Agents

## Project Overview

A sophisticated physics simulation with dual modes: **Sandbox** (free-form physics playground) and **Game** (structured levels with objectives). Built with React, HTML5 Canvas, GSAP animations, and TypeScript physics.

- **Modern stack**: React 18 + Vite + TypeScript physics + Vitest testing + SCSS styling
- **Dual architecture**: `src/utils/physics.jsx` (main) coexists with `src/utils/physics.ts` (typed refactor)
- **Game system**: Level definitions with hazards, goals, powerups, win/lose conditions, and audio

## Architecture Layers

### Physics Engine (`src/utils/physics.jsx` + `Ball.ts`)

```javascript
// Core physics loop pattern
export function loop(ctx, balls, canvasWidth, canvasHeight, physicsSettings,
  backgroundColor, currentClearAlpha, setGlobalScore, selectedBall, level,
  setScoredBallsCount, setRemovedBallsCount, onPlayerHitGoal)

// Collision system with health, deformation, cooldowns
export function solveCollisions(balls, healthSystemEnabled, healthDamageMultiplier, ...)
```

### Level System (`src/js/levels/levels.js`)

- **Position syntax**: `"center"`, `"bottom-40"`, `"right-20%"`, `"left+24"` (see `levelPositioning.js`)
- **Static objects**: Hazards damage players, goals trigger win/lose, powerups give temporary abilities
- **Level constants**: Per-level physics overrides in `gravityGauntlet.constants.js`

### State Management (`App.jsx`)

- **Mode switching**: `levelMode` boolean toggles sandbox vs game
- **Settings persistence**: Different localStorage keys for sandbox vs gauntlet settings
- **Event handling**: WASD movement, keyboard shortcuts (R=reset, M=gas, J=jump)

## Critical Patterns

### Dual Physics Architecture

```javascript
// Main physics (physics.jsx) - use for new features
import { Ball } from './Ball.ts'; // TypeScript Ball class
import { solveCollisions, loop } from '../utils/physics.jsx';

// When adding level objects, pre-resolve positions:
const resolvedHazards = level.hazards.map((h) => ({
  ...h,
  ...resolveLevelPos(h, canvasWidth, canvasHeight),
}));
```

### Settings Configuration

```javascript
// Config inheritance pattern (config.jsx)
export const GRAVITY_GAUNTLET_DEFAULTS = {
  ...DEFAULTS, // Always inherit base
  enableGravity: true,
  ballCount: 5,
  gameplay: { ...DEFAULTS.gameplay, sandbox: false },
};
```

### Component State Lifting

```jsx
// App.jsx controls all physics settings, components receive props
const [physicsSettings, setPhysicsSettings] = useState(mergedSettings);
<Canvas physicsSettings={physicsSettings} level={currentLevel} ... />
<Controls physicsSettings={physicsSettings} onSettingsChange={setPhysicsSettings} />
```

## Developer Workflows

### Commands

- `npm run dev` - Vite dev server with hot reload
- `npm test` - Vitest unit tests (physics, collision, UI behavior)
- `npm run typecheck` - TypeScript validation
- `npm run lint:fix` - ESLint auto-fix

### Testing Strategy

- **Unit tests**: Physics collision logic (`test/physics.test.js`)
- **Integration tests**: Level interactions (`test/physics.goal.win-lose.test.js`)
- **UI behavior**: Control panel toggles (`test/ui.showControls.e2e.test.js`)

### Audio System (`src/utils/sound.js`)

- BGM tracks with individual gain controls
- SFX gating system prevents audio spam
- Local storage persistence: `ui:musicVolume`, `ui:sfxMuted`, etc.

## Level Development

### Creating Levels

```javascript
// In levels.js - position objects with flexible syntax
{
  id: 'custom-level',
  type: 'gravityGauntlet',
  hazards: [
    { x: 'left+25%', y: 'middle', width: 120, height: 18, shape: 'square' }
  ],
  goals: [
    { x: 'center', y: 'bottom-80', radius: 40, shape: 'circle' }
  ],
  powerups: [
    { type: 'shield', x: 'right-10%', y: 'top+50', radius: 14 }
  ]
}
```

### Physics Constants

```javascript
// Per-level physics tuning (gravityGauntlet.constants.js)
export const GAME_MODE_CONSTANTS = {
  PHYSICS: {
    COLLISION_ELASTICITY: 0.9,
    COLLISION_ITERATIONS: 5,
    WALL_GRAZING_THRESHOLD: 2,
  },
};
```

## Integration Points

### Canvas Rendering (`canvasRendering.js`)

- Static shape rendering: `drawStaticShape(resolvedObject)`
- Powerup rendering: `drawPowerup(ctx, powerupObject)`
- Ball rendering: `ball.draw(ctx, selectedBall)` method

### Storage & Persistence (`storage.js`)

- URL hash seeding: `seedLocalStorageFromHash()` for level sharing
- Level export: `buildLevelJSON(levelObject)` for copying to levels registry
- Settings namespacing: `sim:settings:sandbox` vs `sim:settings:gauntlet`

## Common Pitfalls

1. **Position resolution**: Always use `resolveLevelPos()` for level objects, don't hardcode pixel coordinates
2. **Ball collision cooldowns**: Required to prevent sticking - check `lastCollisionTime` patterns
3. **Settings inheritance**: New game modes must extend `DEFAULTS` in config.jsx
4. **TypeScript coexistence**: Import Ball from `Ball.ts`, physics functions from `physics.jsx`
5. **Test stubbing**: Use minimal Ball stubs in tests, not full Ball instances

---

For complex physics changes, check existing tests first. For new game mechanics, follow the powerup pickup pattern in `physics.jsx` loop.
