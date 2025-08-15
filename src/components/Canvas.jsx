import React, { useRef, useEffect } from 'react';
import { loop, initializeBalls } from '../utils/physics.jsx';

function Canvas({ balls, physicsSettings, setBalls, setGlobalScore, selectedBall, setSelectedBall }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Create tempCanvas and tempCtx once
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        let animationFrameId;

        const render = () => {
            loop(ctx, balls, canvas.width, canvas.height, physicsSettings, physicsSettings.visuals.backgroundColor, 1 - (physicsSettings.visuals.trailOpacity * 0.9), setGlobalScore, tempCtx);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

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

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, [balls, physicsSettings, setBalls, setGlobalScore, selectedBall, setSelectedBall]);

    return (
        <canvas ref={canvasRef} style={{ display: 'block' }} />
    );
}

export default Canvas;