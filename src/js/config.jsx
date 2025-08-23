export const DEFAULTS = {
    bounceSpeed: 1,
    enableGravity: false,
    gravityStrength: 0.1,
    ballShape: 'circle',
    ballSize: 45,
    ballVelocity: 7,
    newBallSize: 45,
    ballCount: 50,
    deformation: {
        enabled: true,
        intensity: 0.5,
        speed: 0.5,
        ease: 'elastic.out(1, 0.3)',
        easeOverride: ''
    },
    visuals: {
        backgroundColor: '#000000',
        trailOpacity: 0.1,
        uiOpacity: 0.8
    },
    gameplay: {
        scoring: true,
        sandbox: false,
        healthSystem: true,
        healthDamageMultiplier: 1
    }
};