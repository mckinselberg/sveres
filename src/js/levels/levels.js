// Central registry of game levels. Level 1 = Gravity Gauntlet

export const GAME_LEVELS = [
  {
    id: 'gauntlet-1',
    index: 0,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gravity Gauntlet',
    difficulty: '1',
    // Visual objects
    hazards: [],
    goals: [
      { x: "center", y: "bottom - 80", radius: 40, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      // Place within easy reach of the player spawn (center-top area)
      /* 
        Enhanced resolveLevelPos in physics.jsx to support:
        Numbers: 120
        Percentages: '50%'
        Centering: 'center' (x) and 'center'/'middle' (y), with offsets like 'center+20'
        Edge anchors with offsets:
        X: 'right', 'right-20', 'right-10%', 'left+24'
        Y: 'bottom', 'bottom-24', 'bottom-5%', 'top+12'
        Offsets can be px or %, and edge anchors respect the shape's half-size (radius for circles, width/height/2 for rects) so objects stay inside the canvas.
        Examples you can use in levels.js
        Place goal 40px above bottom, centered horizontally:
        x: 'center'
        y: 'bottom-40'
        Place hazard 10% from right edge and 24px from top:
        x: 'right-10%'
        y: 'top+24'
        Place powerup 5% up from bottom and 20% in from left:
        x: '20%'
        y: 'bottom-5%'
      */
      { type: 'speed',  x: "left", y: 'bottom - 10', radius: 14, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: "right", y: 'bottom - 10', radius: 14, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: "center", y: 'bottom', radius: 14, color: 'magenta',     shape: 'circle' }
    ],
    // Optional per-level physics overrides
    physics: {
      COLLISION_ELASTICITY: 0.9,
      COLLISION_ITERATIONS: 5,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    }
  }
];

export function getLevelById(id) {
  return GAME_LEVELS.find(l => l.id === id) || null;
}
