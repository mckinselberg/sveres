import { describe, it, expect } from 'vitest';
import { spawnBulletHellIfDue } from '../src/utils/bulletHell.js';

describe('spawnBulletHellIfDue', () => {
  it('spawns at most one bullet per cadence and aims toward player', () => {
    const ctx = {};
    const balls = [];
    const W = 400, H = 300;
    const physicsSettings = { ballVelocity: 8 };
    const player = { x: 200, y: 150 };

    let lastBullet = null;
    const makeBullet = (x, y, vx, vy) => {
      lastBullet = { x, y, vx, vy };
      return lastBullet;
    };

    spawnBulletHellIfDue(ctx, balls, W, H, physicsSettings, player, makeBullet);
    const firstCount = balls.length;
    // Immediately call again; throttle should prevent a second spawn
    spawnBulletHellIfDue(ctx, balls, W, H, physicsSettings, player, makeBullet);
    expect(balls.length).toBe(firstCount);

    // Validate the bullet is generally aimed toward player: vx, vy should reduce distance
    if (lastBullet) {
      const dx = player.x - lastBullet.x;
      const dy = player.y - lastBullet.y;
      // Dot product of (vx,vy) with vector to player should be positive
      expect(lastBullet.vx * dx + lastBullet.vy * dy).toBeGreaterThan(0);
    }
  });
});
