import React, { useRef, useEffect, memo } from 'react';
import { loop } from '../utils/physics.jsx';

const Canvas = memo(({ balls, enableGravity, gravityStrength, ballVelocity, deformation, gameplay, backgroundColor, trailOpacity, setBalls, setGlobalScore, selectedBall, setSelectedBall, isPaused }) => {
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const render = () => {
                                    loop(ctx, balls, canvas.width, canvas.height, { enableGravity, gravityStrength, ballVelocity, deformation, gameplay }, backgroundColor, 1 - (trailOpacity * 0.9), setGlobalScore, selectedBall);
            animationFrameId.current = requestAnimationFrame(render);
        };

        if (!isPaused) {
            render();
        }

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        handleResize();

        const handleMouseDown = (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            let ballClicked = false;
            for (let i = balls.length - 1; i >= 0; i--) {
                const ball = balls[i];
                const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
                if (distance < ball.size) {
                    setSelectedBall(ball);
                    ballClicked = true;
                    break;
                }
            }

            if (!ballClicked && selectedBall) {
                setSelectedBall(null); // Deselect if clicked outside
            }
        };

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousedown', handleMouseDown);

        // Prevent zoom gestures on the canvas (mobile)
        canvas.addEventListener('gesturestart', (e) => e.preventDefault());
        canvas.addEventListener('gesturechange', (e) => e.preventDefault());
        canvas.addEventListener('gestureend', (e) => e.preventDefault());
        canvas.addEventListener('touchstart', function(e) {
            if (e.touches && e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchmove', function(e) {
            if (e.touches && e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        // Prevent double-tap to zoom
        let _lastTouchEnd = 0;
        canvas.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - _lastTouchEnd <= 300) e.preventDefault();
            _lastTouchEnd = now;
        }, { passive: false });

        return () => {
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, [balls, enableGravity, gravityStrength, ballVelocity, deformation, backgroundColor, trailOpacity, setBalls, setGlobalScore, selectedBall, setSelectedBall, isPaused]);

    return (
        <canvas ref={canvasRef} style={{ display: 'block' }} />
    );
});

export default Canvas;