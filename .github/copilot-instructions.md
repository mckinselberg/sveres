# Copilot Instructions for AI Agents

## Project Overview

- This project is a physics-based interactive simulation using HTML5 Canvas, React, and GSAP for animation.
- The main simulation logic is in `src/` (modern React/JSX) and `legacy/src/` (older JS, non-React). The current focus is on the modern `src/` directory.
- The app features real-time, event-driven controls, persistent color schemes, and a variety of geometric shapes with advanced collision and deformation physics.

## Architecture & Key Patterns

- **Physics Engine**: Core logic in `src/js/` and `src/utils/physics.jsx`. Ball and shape classes encapsulate state and behavior. Collision detection uses spatial partitioning, cooldowns, and energy conservation.
- **UI/Controls**: React components in `src/components/` manage overlays, sliders, and settings. State is often lifted to parent components for global control.
- **Event-Driven**: User actions (sliders, color pickers, etc.) trigger immediate updates via React state and event handlers.
- **Persistence**: Color schemes and some settings are saved to local storage (see `usePersistentDetails.js`).
- **Animation**: GSAP is used for all deformation and ripple effects. See `applyDeformation` and `addRipple` patterns.

## Developer Workflows

- **Development**: `npm run dev` (Vite dev server, hot reload)
- **Production Build**: `npm run build`
- **Preview Build**: `npm run preview`
- **Config**: Physics and animation constants in `src/js/config.jsx` and `src/js/balls.js`.

## Project-Specific Conventions

- **Shapes**: All shapes (circle, square, triangle, diamond, pentagon, hexagon, star) are supported and selectable. Shape logic is modular.
- **Collision**: Use bounding circles for all shape types. Cooldown system prevents rapid re-collisions.
- **Deformation**: Always use GSAP timelines for shape deformation and restoration.
- **UI**: Use React state for all user-facing controls. Avoid direct DOM manipulation except in Canvas rendering.
- **Legacy**: `legacy/` is for reference only; do not add new features there.

## Integration & Dependencies

- **GSAP**: For all animation (deformation, ripples, transitions)
- **Vite**: For build and dev server
- **React**: For UI and state management

## Examples

- See `src/components/SelectedBallControls.jsx` for per-object editing patterns.
- See `src/utils/physics.jsx` for collision and deformation logic.
- See `src/hooks/usePersistentDetails.js` for local storage usage.

## Tips for AI Agents

- Always update both physics and UI when adding new shape types or properties.
- When changing physics, update both the config and the relevant React controls.
- Use the README for up-to-date architecture and workflow details.

---

For questions or unclear conventions, consult the README or ask for clarification.
