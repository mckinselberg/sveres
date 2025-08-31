// Global engine physics constants with reasonable defaults
export const ENGINE_CONSTANTS = {
  COLLISION_ELASTICITY: 0.9,
  COLLISION_ITERATIONS: 5,
  WALL_GRAZING_THRESHOLD: 2,
  PLAYER_MIN_WALL_REBOUND: 1.2,
  WALL_RESTITUTION: 0.86, // <1 reduces bounce height on each impact
};
