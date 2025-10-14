// Central registry of game levels. Level 1 = Gravity Gauntlet
import { GAME_MODE_CONSTANTS } from './gravityGauntlet.constants.js';

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
      ...GAME_MODE_CONSTANTS.PHYSICS,
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
      ...GAME_MODE_CONSTANTS.PHYSICS,
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
    timeLimitSec: 45,
    iFrameMs: 800
  },
  {
    id: 'gauntlet-3',
    index: 2,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet III: The Maze',
    difficulty: '3',
    instructions: 'Navigate through obstacles to reach the central goal. Use wall bounces strategically.',
    seed: 303,
    // Visual objects - maze-like structure
    hazards: [
      // Outer maze walls
      { x: 'left+15%',   y: 'top+25%',    width: 200, height: 20, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-15%',  y: 'top+25%',    width: 200, height: 20, color: '#444', shape: 'square', isStatic: true },
      { x: 'left+15%',   y: 'bottom-25%', width: 200, height: 20, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-15%',  y: 'bottom-25%', width: 200, height: 20, color: '#444', shape: 'square', isStatic: true },
      // Central barriers
      { x: 'center-30%', y: 'middle',     width: 20, height: 120, color: '#444', shape: 'square', isStatic: true },
      { x: 'center+30%', y: 'middle',     width: 20, height: 120, color: '#444', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'center', y: 'middle', radius: 28, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'speed',  x: 'left+10%',  y: 'middle-15%', radius: 12, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-10%', y: 'middle+15%', radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 'center',    y: 'top+15%',    radius: 12, color: 'magenta',     shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'bullet-hell-2',
    index: 101,
    mode: 'game',
    type: 'bulletHell',
    title: 'Bullet Hell II: Crossfire',
    difficulty: '4',
    instructions: 'Survive intense crossfire patterns. Health pickups are scarce - make every move count.',
    seed: 401,
    hazards: [],
    goals: [],
    powerups: [
      { type: 'health', x: 'left+25%',  y: 'top+25%',    radius: 12, color: 'lime',        shape: 'circle', amount: 20 },
      { type: 'health', x: 'right-25%', y: 'bottom-25%', radius: 12, color: 'lime',        shape: 'circle', amount: 20 },
      { type: 'shield', x: 'center',    y: 'middle',     radius: 12, color: 'deepskyblue', shape: 'circle' }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 60,
    iFrameMs: 600
  },
  {
    id: 'gauntlet-4',
    index: 3,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet IV: Multi-Target',
    difficulty: '4',
    instructions: 'Multiple goals require precision timing. Clear them in sequence or risk collision.',
    seed: 404,
    hazards: [
      // Moving platforms (static for now, but positioned strategically)
      { x: 'left+20%',  y: 'middle-10%', width: 80, height: 15, color: '#666', shape: 'square', isStatic: true },
      { x: 'right-20%', y: 'middle+10%', width: 80, height: 15, color: '#666', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'left+25%',  y: 'bottom-60', radius: 24, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'center',    y: 'bottom-60', radius: 24, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'right-25%', y: 'bottom-60', radius: 24, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'speed',  x: 'left+15%',  y: 'top+20%', radius: 12, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-15%', y: 'top+20%', radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 'center',    y: 'top+30%', radius: 12, color: 'magenta',     shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'bullet-hell-3',
    index: 102,
    mode: 'game',
    type: 'bulletHell',
    title: 'Bullet Hell III: Endurance',
    difficulty: '5',
    instructions: 'The ultimate survival test. 90 seconds of relentless chaos with minimal powerups.',
    seed: 505,
    hazards: [],
    goals: [],
    powerups: [
      { type: 'health', x: 'center',    y: 'middle',     radius: 14, color: 'lime',        shape: 'circle', amount: 30 },
      { type: 'speed',  x: 'left+30%',  y: 'bottom-30%', radius: 12, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-30%', y: 'top+30%',    radius: 12, color: 'deepskyblue', shape: 'circle' }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 90,
    iFrameMs: 500
  },
  {
    id: 'gauntlet-5',
    index: 4,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet V: The Funnel',
    difficulty: '5',
    instructions: 'Navigate through a narrowing funnel of obstacles. Momentum control is everything.',
    seed: 505,
    hazards: [
      // Funnel entrance - wide opening
      { x: 'left+10%',  y: 'top+30%',    width: 15, height: 100, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-10%', y: 'top+30%',    width: 15, height: 100, color: '#444', shape: 'square', isStatic: true },
      // Middle section - narrower
      { x: 'left+25%',  y: 'middle+5%',  width: 15, height: 80, color: '#555', shape: 'square', isStatic: true },
      { x: 'right-25%', y: 'middle+5%',  width: 15, height: 80, color: '#555', shape: 'square', isStatic: true },
      // Funnel exit - narrowest
      { x: 'left+35%',  y: 'bottom-20%', width: 15, height: 60, color: '#666', shape: 'square', isStatic: true },
      { x: 'right-35%', y: 'bottom-20%', width: 15, height: 60, color: '#666', shape: 'square', isStatic: true },
      // Deflector obstacles in funnel
      { x: 'center-5%', y: 'middle-8%',  width: 25, height: 12, color: '#777', shape: 'square', isStatic: true },
      { x: 'center+5%', y: 'middle+8%',  width: 25, height: 12, color: '#777', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'center', y: 'bottom-30', radius: 22, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'shrink', x: 'center',    y: 'top+40%',    radius: 10, color: 'magenta',     shape: 'circle' },
      { type: 'speed',  x: 'left+40%',  y: 'middle-5%',  radius: 10, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-40%', y: 'middle+5%',  radius: 10, color: 'deepskyblue', shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'gauntlet-6',
    index: 5,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet VI: Ricochet Master',
    difficulty: '6',
    instructions: 'Master the art of calculated rebounds. Direct paths are blocked - use the walls.',
    seed: 606,
    hazards: [
      // Central blocking wall
      { x: 'center',     y: 'middle',     width: 25, height: 200, color: '#444', shape: 'square', isStatic: true },
      // Angled deflectors for ricochet gameplay
      { x: 'left+30%',   y: 'top+40%',    width: 60, height: 12, color: '#555', shape: 'square', isStatic: true },
      { x: 'right-30%',  y: 'top+40%',    width: 60, height: 12, color: '#555', shape: 'square', isStatic: true },
      { x: 'left+30%',   y: 'bottom-40%', width: 60, height: 12, color: '#555', shape: 'square', isStatic: true },
      { x: 'right-30%',  y: 'bottom-40%', width: 60, height: 12, color: '#555', shape: 'square', isStatic: true },
      // Corner barriers
      { x: 'left+15%',   y: 'top+25%',    width: 15, height: 40, color: '#666', shape: 'square', isStatic: true },
      { x: 'right-15%',  y: 'bottom-25%', width: 15, height: 40, color: '#666', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'right-25%', y: 'middle-15%', radius: 18, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'left+25%',  y: 'middle+15%', radius: 18, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      { type: 'speed',  x: 'left+20%',  y: 'bottom-15%', radius: 12, color: 'gold',        shape: 'circle' },
      { type: 'shield', x: 'right-20%', y: 'top+15%',    radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 'center-40%', y: 'middle',    radius: 12, color: 'magenta',     shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
    }
  },
  {
    id: 'bullet-hell-4',
    index: 103,
    mode: 'game',
    type: 'bulletHell',
    title: 'Bullet Hell IV: Storm Patterns',
    difficulty: '6',
    instructions: 'Survive chaotic storm patterns with brief safe zones. Time your movements carefully.',
    seed: 606,
    hazards: [],
    goals: [],
    powerups: [
      { type: 'health', x: 'left+15%',  y: 'top+15%',    radius: 10, color: 'lime',        shape: 'circle', amount: 15 },
      { type: 'health', x: 'right-15%', y: 'bottom-15%', radius: 10, color: 'lime',        shape: 'circle', amount: 15 },
      { type: 'shield', x: 'center',    y: 'middle',     radius: 14, color: 'deepskyblue', shape: 'circle' },
      { type: 'speed',  x: 'left+40%',  y: 'middle',     radius: 10, color: 'gold',        shape: 'circle' },
      { type: 'speed',  x: 'right-40%', y: 'middle',     radius: 10, color: 'gold',        shape: 'circle' }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.96,
      COLLISION_ITERATIONS: 5,
      PLAYER_MIN_WALL_REBOUND: 1.3,
      WALL_GRAZING_THRESHOLD: 1.5,
    },
    timeLimitSec: 75,
    iFrameMs: 400
  },
  {
    id: 'puzzle-1',
    index: 200,
    mode: 'game',
    type: 'puzzle',
    title: 'Puzzle I: Lock and Key',
    difficulty: '4',
    instructions: 'Collect the key powerup first, then unlock the goal. Order matters.',
    seed: 701,
    hazards: [
      // Lock mechanism - barriers around goal
      { x: 'center-30', y: 'bottom-60', width: 60, height: 15, color: '#8B4513', shape: 'square', isStatic: true },
      { x: 'center-22', y: 'bottom-75', width: 15, height: 30, color: '#8B4513', shape: 'square', isStatic: true },
      { x: 'center+8',  y: 'bottom-75', width: 15, height: 30, color: '#8B4513', shape: 'square', isStatic: true },
      // Key chamber walls
      { x: 'left+20%',  y: 'top+30%',   width: 80, height: 15, color: '#444', shape: 'square', isStatic: true },
      { x: 'left+15%',  y: 'top+25%',   width: 15, height: 60, color: '#444', shape: 'square', isStatic: true },
      { x: 'left+35%',  y: 'top+25%',   width: 15, height: 45, color: '#444', shape: 'square', isStatic: true }
    ],
    goals: [
      { x: 'center', y: 'bottom-50', radius: 20, color: 'yellow', shape: 'circle', isStatic: true, requiresKey: true }
    ],
    powerups: [
      { type: 'key',    x: 'left+25%', y: 'top+50%',   radius: 12, color: 'gold',        shape: 'star' },
      { type: 'shield', x: 'right-20%', y: 'middle',   radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'shrink', x: 'center',    y: 'top+20%',  radius: 12, color: 'magenta',     shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
    }
  }
];

export function getLevelById(id) {
  return GAME_LEVELS.find(l => l.id === id) || null;
}
