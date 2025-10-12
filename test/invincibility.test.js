import { describe, it, expect, vi } from 'vitest';
import { handleBallCollision, solveCollisions } from '../src/utils/physics.jsx';
import { Ball } from '../src/utils/Ball.ts';

describe('Invincibility parameter', () => {
    it('should prevent health damage to balls when invincible is true', () => {
        const ball1 = new Ball(0, 0, 'red', 10);
        const ball2 = new Ball(15, 0, 'blue', 10);
        
        // Set initial health and velocity to create realistic collision
        ball1.health = 100;
        ball2.health = 100;
        ball1.velX = 5;
        ball1.velY = 0;
        ball2.velX = -5;
        ball2.velY = 0;
        
        // Mock required parameters
        const setGlobalScore = vi.fn();
        const deformationSettings = { enabled: false };
        
        // Calculate realistic collision parameters
        const dx = ball2.x - ball1.x; // 15
        const dy = ball2.y - ball1.y; // 0
        const distance = Math.sqrt(dx * dx + dy * dy); // 15
        const combinedRadius = ball1.size + ball2.size; // 20
        const normalX = dx / distance; // 1
        const normalY = dy / distance; // 0
        
        // Test with invincibility disabled (should take damage)
        handleBallCollision(
            ball1, ball2, 
            dx, dy, distance, combinedRadius,
            normalX, normalY,
            true, // healthSystemEnabled
            10, // healthDamageMultiplier
            deformationSettings,
            setGlobalScore,
            undefined, // physicsConsts
            false // isInvincible
        );
        
        // Health should be reduced
        expect(ball1.health).toBeLessThan(100);
        expect(ball2.health).toBeLessThan(100);
        
        // Reset health for second test
        ball1.health = 100;
        ball2.health = 100;
        
        // Test with invincibility enabled (should not take damage)
        handleBallCollision(
            ball1, ball2,
            dx, dy, distance, combinedRadius,
            normalX, normalY,
            true, // healthSystemEnabled
            10, // healthDamageMultiplier
            deformationSettings,
            setGlobalScore,
            undefined, // physicsConsts
            true // isInvincible
        );
        
        // Health should remain unchanged
        expect(ball1.health).toBe(100);
        expect(ball2.health).toBe(100);
    });
    
    it('should prevent hazard damage when invincible is true', () => {
        const ball = new Ball(0, 0, 'red', 10);
        ball.health = 100;
        ball.isStartingBall = true;
        
        const mockLevel = {
            hazards: [
                { x: 0, y: 0, width: 20, height: 20, shape: 'square', color: 'red' }
            ]
        };
        
        const mockCallbacks = {
            setGlobalScore: vi.fn(),
            setScoredBallsCount: vi.fn(),
            setRemovedBallsCount: vi.fn(),
            onPlayerHitGoal: vi.fn()
        };
        
        // Test with invincibility enabled - should not take hazard damage
        solveCollisions(
            [ball],
            true, // healthSystemEnabled
            1, // healthDamageMultiplier
            { enabled: false }, // deformationSettings
            800, 600, // canvasWidth, canvasHeight
            mockCallbacks.setGlobalScore,
            mockLevel,
            mockCallbacks.setScoredBallsCount,
            mockCallbacks.setRemovedBallsCount,
            mockCallbacks.onPlayerHitGoal,
            ball, // selectedBall
            [], // preResolvedStaticObjects
            true, // popDespawnEnabled
            true // isInvincible
        );
        
        // Health should remain unchanged despite hazard collision
        expect(ball.health).toBe(100);
    });
    
    it('should prevent bullet hell damage when invincible is true', () => {
        const playerBall = new Ball(0, 0, 'red', 10);
        const bulletBall = new Ball(15, 0, 'blue', 5);
        
        // Set up bullet hell scenario
        playerBall.health = 100;
        playerBall.isStartingBall = true;
        bulletBall.isBullet = true;
        bulletBall.health = 100;
        
        const mockCallbacks = {
            setGlobalScore: vi.fn(),
            setScoredBallsCount: vi.fn(),
            setRemovedBallsCount: vi.fn(),
            onPlayerHitGoal: vi.fn()
        };
        
        const mockLevel = { type: 'bulletHell' };
        
        // Test bullet collision with invincibility enabled
        solveCollisions(
            [playerBall, bulletBall],
            true, // healthSystemEnabled
            1, // healthDamageMultiplier
            { enabled: false }, // deformationSettings
            800, 600, // canvasWidth, canvasHeight
            mockCallbacks.setGlobalScore,
            mockLevel,
            mockCallbacks.setScoredBallsCount,
            mockCallbacks.setRemovedBallsCount,
            mockCallbacks.onPlayerHitGoal,
            playerBall, // selectedBall
            [], // preResolvedStaticObjects
            true, // popDespawnEnabled
            true // isInvincible
        );
        
        // Player health should remain unchanged despite bullet collision
        expect(playerBall.health).toBe(100);
    });
});