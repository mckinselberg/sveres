export const DEFAULTS = {
    bounceSpeed: 1,
    enableGravity: false,
    gravityStrength: 0.1,
    ballShape: 'circle',
    ballSize: 45,
    ballVelocity: 7,
    newBallSize: 45,
    ballCount: 15,
    deformation: {
        enabled: true,
        intensity: 0.5,
        speed: 0.5,
        ease: 'elastic.out(1, 0.3)',
        easeOverride: ''
    },
    visuals: {
        backgroundColor: '#222020',
        trailOpacity: 0.6,
        uiOpacity: 0.8
    },
    gameplay: {
        scoring: true,
        sandbox: false,
        healthSystem: true,
        healthDamageMultiplier: 1
    }
};

export const GRAVITY_GAUNTLET_DEFAULTS = {
    ...DEFAULTS, // Inherit all default settings
    enableGravity: true,
    gravityStrength: 0.2, // Slightly stronger gravity for the gauntlet
    ballCount: 5, // Fixed number of balls for the level
    ballShape: 'mixed', // Mixed shapes for variety
    ballSize: 30, // Smaller balls for more precise navigation
    ballVelocity: 5, // Moderate velocity
    gameplay: {
        ...DEFAULTS.gameplay,
        scoring: true,
        sandbox: false, // Not a sandbox level
        healthSystem: true,
        healthDamageMultiplier: 0.2 // Each hit takes 20% health
    },
    level: { // New property to define level-specific elements
        type: 'gravityGauntlet',
        constantsKey: 'gravityGauntlet',
        hazards: [],
        goals: [
            // Example goal: a static circular target
            { x: 700, y: 550, radius: 40, color: 'lime', shape: 'circle', isStatic: true }
        ]
    }
};