// Central registry of game levels. Level 1 = Gravity Gauntlet
import { GRAVITY_GAUNTLET_CONSTANTS } from './gravityGauntlet.constants.js';

export const GAME_LEVELS = [
  {
    id: 'gauntlet-1',
    index: 0,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet I: Foundations',
    difficulty: '1',
    instructions: 'Reach the goal at the bottom while managing your momentum. Use platforms and rebounds to line up your shot.',
    seed: 101,
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
      ...GRAVITY_GAUNTLET_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'gauntlet-2',
    index: 1,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet II: Twin Rings',
    difficulty: '2',
    instructions: 'Twin goals demand precision. Use platforms to shape your trajectory and thread the rings.',
    seed: 202,
    // Visual objects
    hazards: [
      // Simple platforms to shape trajectories
      { x: 'left+25%',  y: 'middle',     width: 120, height: 18, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-25%', y: 'middle+40',  width: 120, height: 18, color: '#444', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'left+20%',  y: 'bottom-120', radius: 34, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'right-20%', y: 'bottom-120', radius: 34, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'speed',  x: 'left+20%',  y: 'bottom-12', radius: 14, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-20%', y: 'bottom-12', radius: 14, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 'center',    y: 'bottom-12', radius: 14, color: 'magenta',     shape: 'circle' }
    ],
    physics: {
      ...GRAVITY_GAUNTLET_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'bullet-hell-1',
    index: 100,
    mode: 'game',
    type: 'bulletHell',
    title: 'Bullet Hell I: Dodge!',
    difficulty: '3',
    instructions: 'Survive a relentless barrage. Keep moving and grab powerups to extend your chances.',
    seed: 301,
    hazards: [],
    goals: [],
    powerups: [
      { type: 'shield', x: 'left+20%',  y: 'bottom-12', radius: 14, color: 'deepskyblue', shape: 'circle' },
      { type: 'speed',  x: 'right-20%', y: 'bottom-12', radius: 14, color: 'gold',        shape: 'circle' },
      { type: 'health', x: 'center',    y: 'bottom-12', radius: 14, color: 'lime',        shape: 'circle', amount: 25 }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 60
  }
];

export function getLevelById(id) {
  return GAME_LEVELS.find(l => l.id === id) || null;
}
