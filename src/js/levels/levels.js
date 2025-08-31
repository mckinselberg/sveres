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
      { x: 700, y: 550, radius: 40, color: 'red', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'speed',  x: 280, y: 200, radius: 14, color: 'gold',       shape: 'circle' },
      { type: 'shield', x: 560, y: 260, radius: 14, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 900, y: 360, radius: 14, color: 'magenta',     shape: 'circle' }
    ],
    // Optional per-level physics overrides
    physics: {
      COLLISION_ELASTICITY: 0.9,
      COLLISION_ITERATIONS: 5,
      WALL_GRAZING_THRESHOLD: 2,
      PLAYER_MIN_WALL_REBOUND: 1.2,
    }
  }
];

export function getLevelById(id) {
  return GAME_LEVELS.find(l => l.id === id) || null;
}
