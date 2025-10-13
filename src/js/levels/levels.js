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
    instructions: 'Your first challenge! Use WASD to move, collect powerups, and reach the goal. Platforms will help guide your path.',
    seed: 101,
    // Visual objects - tutorial level with gentle learning curve
    hazards: [
      // Gentle guiding platforms that teach navigation without being punishing
      { x: 'left+20%', y: 'middle+20%', width: 100, height: 16, color: '#555', shape: 'square', isStatic: true },
      { x: 'right-20%', y: 'middle-20%', width: 100, height: 16, color: '#555', shape: 'square', isStatic: true }
    ],
    goals: [
      // Smaller goal that still feels achievable for beginners
      { x: "center", y: "bottom-60", radius: 32, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      // Tutorial powerups positioned to teach collection strategy
      { type: 'health', x: "center", y: 'middle', radius: 14, color: 'lime', shape: 'circle', amount: 15 },
      { type: 'speed',  x: "left+30%", y: 'middle+40%', radius: 12, color: 'gold', shape: 'circle' },
      { type: 'shield', x: "right-30%", y: 'middle-40%', radius: 12, color: 'deepskyblue', shape: 'circle' }
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
    title: 'Gauntlet II: Split Decision',
    difficulty: '2',
    instructions: 'Two paths, two goals. Choose your route wisely and use momentum to reach both targets.',
    seed: 202,
    // Visual objects - creates two distinct paths
    hazards: [
      // Create two pathways with strategic platform placement
      { x: 'left+15%',  y: 'middle-30%', width: 140, height: 20, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-15%', y: 'middle+30%', width: 140, height: 20, color: '#444', shape: 'square', isStatic: true },
      // Central obstacle to force path choice
      { x: 'center', y: 'middle', width: 80, height: 60, color: '#666', shape: 'square', isStatic: true }
    ],
    goals: [
      // Separated goals requiring strategic approach
      { x: 'left+25%',  y: 'bottom-80', radius: 28, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'right-25%', y: 'bottom-80', radius: 28, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      // Powerups positioned to teach path planning
      { type: 'speed',  x: 'left+25%',  y: 'middle-50%', radius: 12, color: 'gold', shape: 'circle' },
      { type: 'shield', x: 'right-25%', y: 'middle+50%', radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'health', x: 'center',    y: 'top+25%', radius: 12, color: 'lime', shape: 'circle', amount: 10 }
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
    title: 'Bullet Hell I: Baptism by Fire',
    difficulty: '3',
    instructions: 'Welcome to bullet hell! Survive 50 seconds of projectiles. Learn the patterns and use powerups wisely.',
    seed: 301,
    hazards: [],
    goals: [],
    powerups: [
      // Tutorial-friendly powerup placement with health emphasis
      { type: 'health', x: 'center',    y: 'middle',     radius: 14, color: 'lime', shape: 'circle', amount: 25 },
      { type: 'shield', x: 'left+25%',  y: 'top+25%',    radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'speed',  x: 'right-25%', y: 'bottom-25%', radius: 12, color: 'gold', shape: 'circle' },
      { type: 'health', x: 'left+25%',  y: 'bottom-25%', radius: 12, color: 'lime', shape: 'circle', amount: 20 }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 50,
    iFrameMs: 800
  },
  {
    id: 'gauntlet-3',
    index: 2,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet III: The Labyrinth',
    difficulty: '3',
    instructions: 'Navigate the maze to reach the heart. Dead ends and narrow passages demand precision.',
    seed: 303,
    // Visual objects - true maze-like structure
    hazards: [
      // Outer maze walls creating channels
      { x: 'left+20%',   y: 'top+20%',    width: 160, height: 24, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-20%',  y: 'top+30%',    width: 160, height: 24, color: '#444', shape: 'square', isStatic: true },
      { x: 'left+20%',   y: 'bottom-30%', width: 160, height: 24, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-20%',  y: 'bottom-20%', width: 160, height: 24, color: '#444', shape: 'square', isStatic: true },
      // Vertical maze barriers creating passages
      { x: 'left+35%',   y: 'middle-15%', width: 24, height: 100, color: '#444', shape: 'square', isStatic: true },
      { x: 'right-35%',  y: 'middle+15%', width: 24, height: 100, color: '#444', shape: 'square', isStatic: true },
      // Additional complexity - smaller barriers
      { x: 'center-15%', y: 'top+40%',    width: 60, height: 20, color: '#555', shape: 'square', isStatic: true },
      { x: 'center+15%', y: 'bottom-40%', width: 60, height: 20, color: '#555', shape: 'square', isStatic: true }
    ],
    goals: [
      // Goal positioned to require navigation through the maze
      { x: 'center+10%', y: 'middle-10%', radius: 24, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      // Powerups hidden in maze corners to reward exploration
      { type: 'speed',  x: 'left+15%',  y: 'top+35%',    radius: 10, color: 'gold', shape: 'circle' },
      { type: 'shield', x: 'right-15%', y: 'bottom-35%', radius: 10, color: 'deepskyblue', shape: 'circle' },
      { type: 'health', x: 'center-25%', y: 'middle+25%', radius: 10, color: 'lime', shape: 'circle', amount: 15 },
      { type: 'shrink', x: 'center',     y: 'top+15%',    radius: 10, color: 'magenta', shape: 'circle' }
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
    title: 'Bullet Hell II: Crossfire Protocol',
    difficulty: '4',
    instructions: 'Survive 65 seconds of intense crossfire patterns. Health is precious - every pickup counts.',
    seed: 401,
    hazards: [],
    goals: [],
    powerups: [
      // More sparse powerups requiring strategic movement
      { type: 'health', x: 'center',    y: 'top+20%',    radius: 12, color: 'lime', shape: 'circle', amount: 20 },
      { type: 'health', x: 'left+30%',  y: 'bottom-30%', radius: 12, color: 'lime', shape: 'circle', amount: 20 },
      { type: 'health', x: 'right-30%', y: 'top+30%',    radius: 12, color: 'lime', shape: 'circle', amount: 20 },
      { type: 'shield', x: 'center',    y: 'bottom-20%', radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'speed',  x: 'center',    y: 'middle',     radius: 12, color: 'gold', shape: 'circle' }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 65,
    iFrameMs: 650
  },
  {
    id: 'gauntlet-4',
    index: 3,
    mode: 'game',
    type: 'gravityGauntlet',
    title: 'Gauntlet IV: Master\'s Trial',
    difficulty: '4',
    instructions: 'The ultimate test. Multiple goals, complex paths, and precise timing required. Master all skills.',
    seed: 404,
    hazards: [
      // Complex multi-level platform system
      { x: 'left+25%',  y: 'top+25%',    width: 100, height: 18, color: '#666', shape: 'square', isStatic: true },
      { x: 'right-25%', y: 'top+35%',    width: 100, height: 18, color: '#666', shape: 'square', isStatic: true },
      { x: 'left+25%',  y: 'middle+5%',  width: 80,  height: 18, color: '#666', shape: 'square', isStatic: true },
      { x: 'right-25%', y: 'middle-5%',  width: 80,  height: 18, color: '#666', shape: 'square', isStatic: true },
      // Challenging barriers requiring skill
      { x: 'center-20%', y: 'middle-25%', width: 24, height: 80, color: '#444', shape: 'square', isStatic: true },
      { x: 'center+20%', y: 'middle+25%', width: 24, height: 80, color: '#444', shape: 'square', isStatic: true },
      // Final obstacle before goals
      { x: 'center', y: 'bottom-120', width: 120, height: 20, color: '#333', shape: 'square', isStatic: true }
    ],
    goals: [
      // Three goals requiring different approach strategies
      { x: 'left+20%',  y: 'bottom-40', radius: 20, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'center',    y: 'bottom-40', radius: 20, color: 'yellow', shape: 'circle', isStatic: true },
      { x: 'right-20%', y: 'bottom-40', radius: 20, color: 'yellow', shape: 'circle', isStatic: true }
    ],
    powerups: [
      // Strategic powerup placement requiring risk/reward decisions
      { type: 'speed',  x: 'left+15%',  y: 'middle-35%', radius: 10, color: 'gold', shape: 'circle' },
      { type: 'shield', x: 'right-15%', y: 'middle+35%', radius: 10, color: 'deepskyblue', shape: 'circle' },
      { type: 'health', x: 'center',    y: 'top+20%',    radius: 10, color: 'lime', shape: 'circle', amount: 20 },
      { type: 'shrink', x: 'center',    y: 'middle',     radius: 10, color: 'magenta', shape: 'circle' }
    ],
    physics: {
      ...GAME_MODE_CONSTANTS.PHYSICS,
      // Slightly more challenging physics for the final level
      COLLISION_ELASTICITY: 0.85,
    }
  },
  {
    id: 'bullet-hell-3',
    index: 102,
    mode: 'game',
    type: 'bulletHell',
    title: 'Bullet Hell III: Final Convergence',
    difficulty: '5',
    instructions: 'The ultimate 80-second trial. Minimal powerups, maximum chaos. Only the skilled survive.',
    seed: 505,
    hazards: [],
    goals: [],
    powerups: [
      // Minimal powerups for maximum challenge
      { type: 'health', x: 'center',    y: 'middle',     radius: 14, color: 'lime', shape: 'circle', amount: 30 },
      { type: 'shield', x: 'left+35%',  y: 'top+35%',    radius: 12, color: 'deepskyblue', shape: 'circle' },
      { type: 'speed',  x: 'right-35%', y: 'bottom-35%', radius: 12, color: 'gold', shape: 'circle' }
    ],
    physics: {
      COLLISION_ELASTICITY: 0.95,
      COLLISION_ITERATIONS: 4,
      PLAYER_MIN_WALL_REBOUND: 1.2,
      WALL_GRAZING_THRESHOLD: 2,
    },
    timeLimitSec: 80,
    iFrameMs: 550
  }
];

export function getLevelById(id) {
  return GAME_LEVELS.find(l => l.id === id) || null;
}
