// Centralized defaults for ball physics, visuals, and gameplay
// Update values here to change app-wide defaults.
export const DEFAULTS = {
  // Simulation
  bounceSpeed: 1.0,            // Global animation speed multiplier (0.1–3). 1 = real-time
  enableGravity: false,        // Toggle constant downward gravity
  gravityStrength: 0.5,        // Gravity added per frame (0–2). 0.5 = floaty moon vibes

  // Objects
  ballShape: 'circle',         // Default shape for new balls ('circle', 'square', 'triangle', …). Use 'mixed' for variety
  ballSize: 45,                // Radius in px (10–120). 45 is a comfy default
  // Desired default count; slider uses logarithmic mapping
  ballCount: 5,                // Initial number of balls (3–500 via slider mapping)
  ballVelocity: 7,             // Max initial speed and cap (1–20). 7 is zippy but sane

  // Deformation
  deformation: {
    enabled: true,             // Squash-and-stretch on impacts
    intensity: 1.4,            // 0–1. Higher = squishier
    speed: 0.1,               // Lower = snappier recovery
    ease: 'elastic.out(1.1, 0.5)', // Default GSAP ease. Try 'power2.out' for subtle, elastic for bouncy fun
    easeOverride: ''           // Set to override ease (e.g. 'back.out(1.7)'); leave '' to use the dropdown
  },

  // Visuals
  visuals: {
    backgroundColor: '#000000', // Canvas background color (hex)
    trailOpacity: 0.2,          // 0–1. Higher = longer trails
    uiOpacity: 0.8              // 0–1. Control panels translucency
  },

  // Gameplay
  gameplay: {
    scoring: true,              // Count collisions into a global score
    sandbox: false,             // If true, balls won’t be removed at 0 health
    healthSystem: true,         // Enable health and size shrink on damage
    healthDamageMultiplier: 0.1 // Damage per impact intensity (0 = invincible, 1 = spicy)
  }
};
