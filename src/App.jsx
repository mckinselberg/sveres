import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls.jsx';
import Canvas from './components/Canvas.jsx';
import SelectedBallControls from './components/SelectedBallControls.jsx';
import IntroOverlay from './components/IntroOverlay.jsx';
import './styles/App.scss';
import { DEFAULTS } from './js/config.jsx';
import { initializeBalls, addNewBall, adjustBallCount, resetAllBalls, removeBall, adjustBallVelocities, Ball } from './utils/physics.jsx';

function App() {
    const [physicsSettings, setPhysicsSettings] = useState(DEFAULTS);
    const [balls, setBalls] = useState([]);
    const [globalScore, setGlobalScore] = useState(0);
    const [selectedBall, setSelectedBall] = useState(null); // New state for selected ball
    const [showControls, setShowControls] = useState(true); // State for controls visibility
    const [isPaused, setIsPaused] = useState(false);

    // Initialize balls when component mounts or physics settings change
    useEffect(() => {
        const initialBalls = [];
        initializeBalls(initialBalls, physicsSettings.ballCount, physicsSettings.ballSize, physicsSettings.ballVelocity, window.innerWidth, window.innerHeight, physicsSettings.ballShape);
        setBalls(initialBalls);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (selectedBall) {
                const moveSpeed = 2;
                switch (event.key) {
                    case 'w':
                    case 'ArrowUp':
                        setSelectedBall({ ...selectedBall, velY: -moveSpeed });
                        break;
                    case 'a':
                    case 'ArrowLeft':
                        setSelectedBall({ ...selectedBall, velX: -moveSpeed });
                        break;
                    case 's':
                    case 'ArrowDown':
                        setSelectedBall({ ...selectedBall, velY: moveSpeed });
                        break;
                    case 'd':
                    case 'ArrowRight':
                        setSelectedBall({ ...selectedBall, velX: moveSpeed });
                        break;
                    case 'n':
                        setSelectedBall({ ...selectedBall, velX: selectedBall.velX * 1.5, velY: selectedBall.velY * 1.5 });
                        break;
                    case 'm':
                        setSelectedBall({ ...selectedBall, velX: selectedBall.velX / 1.5, velY: selectedBall.velY / 1.5 });
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedBall]);

    useEffect(() => {
        const handleFocus = () => {
            setIsPaused(false);
        };

        const handleBlur = () => {
            setIsPaused(true);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const handlePhysicsSettingsChange = useCallback((newSettings) => {
        const oldSettings = physicsSettings;
        setPhysicsSettings(newSettings);

        if (newSettings.ballSize !== oldSettings.ballSize) {
            const ratio = newSettings.ballSize / oldSettings.ballSize;
            setBalls(prevBalls => prevBalls.map(ball => {
                const newBall = new Ball(ball.x, ball.y, ball.velX, ball.velY, ball.color, ball.size * ratio, ball.shape);
                newBall.originalSize = ball.originalSize * ratio;
                return newBall;
            }));
        }

        if (newSettings.ballCount !== oldSettings.ballCount) {
            setBalls(prevBalls => {
                const newBalls = [...prevBalls];
                adjustBallCount(newBalls, newSettings.ballCount, newSettings.ballSize, newSettings.ballVelocity, window.innerWidth, window.innerHeight);
                return newBalls;
            });
        }

        if (newSettings.ballVelocity !== oldSettings.ballVelocity) {
            setBalls(prevBalls => {
                const newBalls = [...prevBalls];
                adjustBallVelocities(newBalls, newSettings.ballVelocity);
                return newBalls;
            });
        }
    }, [physicsSettings]);

    const handleAddBall = useCallback(() => {
        setBalls(prevBalls => {
            const newBalls = [...prevBalls];
            addNewBall(newBalls, physicsSettings.newBallSize, physicsSettings.ballVelocity, window.innerWidth, window.innerHeight, null, null, physicsSettings.ballShape);
            return newBalls;
        });
    }, [physicsSettings]);

    const handleRemoveBall = useCallback(() => {
        setBalls(prevBalls => {
            if (prevBalls.length > 1) {
                const newBalls = [...prevBalls];
                removeBall(newBalls, newBalls[newBalls.length - 1]); // Remove the last ball
                return newBalls;
            }
            return prevBalls;
        });
    }, []);

    const handleResetBalls = useCallback(() => {
        setBalls(() => {
            const newBalls = [];
            resetAllBalls(newBalls, physicsSettings.ballCount, physicsSettings.ballSize, physicsSettings.ballVelocity, window.innerWidth, window.innerHeight, physicsSettings.ballShape);
            setGlobalScore(0); // Reset global score on ball reset
            return newBalls;
        });
    }, [physicsSettings]);

    const handleUpdateSelectedBall = useCallback((updatedBall) => {
        setBalls(prevBalls => {
            const newBalls = prevBalls.map(ball => {
                if (ball === selectedBall) {
                    const newBall = new Ball(updatedBall.x, updatedBall.y, updatedBall.velX, updatedBall.velY, updatedBall.color, updatedBall.size, updatedBall.shape);
                    newBall.originalSize = updatedBall.originalSize;
                    newBall.collisionCount = updatedBall.collisionCount;
                    newBall.health = updatedBall.health;
                    newBall.opacity = updatedBall.opacity;
                    newBall._lastMultiplier = updatedBall._lastMultiplier;
                    return newBall;
                }
                return ball;
            });
            setSelectedBall(newBalls.find(b => b.x === updatedBall.x && b.y === updatedBall.y));
            return newBalls;
        });
    }, [selectedBall]);

    const toggleControlsVisibility = useCallback(() => {
        setShowControls(!showControls);
    }, [showControls]);

    const handleApplyColorScheme = useCallback((scheme) => {
        // Update background color
        setPhysicsSettings(prevSettings => ({
            ...prevSettings,
            visuals: {
                ...prevSettings.visuals,
                backgroundColor: scheme.backgroundColor
            }
        }));

        // Update ball colors
        setBalls(prevBalls => {
            return prevBalls.map((ball, index) => {
                if (scheme.ballColors[index]) {
                    ball.color = scheme.ballColors[index];
                    ball.originalColor = scheme.ballColors[index];
                }
                return ball;
            });
        });
    }, []);

    const handleApplyPhysicsSettings = useCallback((settings) => {
        setPhysicsSettings(settings);
    }, []);

    return (
        <div>
            <IntroOverlay />
            <h1 className="page-title">Bouncing Spheres - React</h1>
            <div className="global-score">Global Score: <span>{globalScore}</span></div>
            <Canvas
                balls={balls}
                enableGravity={physicsSettings.enableGravity}
                gravityStrength={physicsSettings.gravityStrength}
                ballVelocity={physicsSettings.ballVelocity}
                deformation={physicsSettings.deformation}
                gameplay={physicsSettings.gameplay}
                backgroundColor={physicsSettings.visuals.backgroundColor}
                trailOpacity={physicsSettings.visuals.trailOpacity}
                setBalls={setBalls}
                setGlobalScore={setGlobalScore}
                selectedBall={selectedBall}
                setSelectedBall={setSelectedBall}
                isPaused={isPaused}
            />
            {showControls && (
                <Controls
                    physicsSettings={physicsSettings}
                    onPhysicsSettingsChange={handlePhysicsSettingsChange}
                    onAddBall={handleAddBall}
                    onRemoveBall={handleRemoveBall}
                    onResetBalls={handleResetBalls}
                    balls={balls}
                    onApplyColorScheme={handleApplyColorScheme}
                    onApplyPhysicsSettings={handleApplyPhysicsSettings}
                />
            )}
            <SelectedBallControls
                selectedBall={selectedBall}
                onUpdateSelectedBall={handleUpdateSelectedBall}
            />
            <button className="toggle-controls-button" onClick={toggleControlsVisibility}>⚙️</button>
        </div>
    );
}

export default App;