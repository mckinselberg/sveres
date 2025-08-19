import React, { useRef, useEffect, useState } from 'react';
import Slider from './Slider.jsx';
import { useDraggable } from '../hooks/useDraggable.js';
import { usePersistentDetails } from '../hooks/usePersistentDetails.js';

function SelectedBallControls({ selectedBall, onUpdateSelectedBall }) {
    const controlsRef = useRef(null);
    const handleRef = useRef(null);
    const position = useDraggable(handleRef);

    const appearanceRef = useRef(null);
    const motionRef = useRef(null);
    const statsRef = useRef(null);

    usePersistentDetails([appearanceRef, motionRef, statsRef]);

    useEffect(() => {
        const savedPosition = JSON.parse(localStorage.getItem("selectedBallControlsPosition"));
        if (savedPosition) {
            controlsRef.current.style.left = savedPosition.left;
            controlsRef.current.style.top = savedPosition.top;
        }
    }, []);

    useEffect(() => {
        if (controlsRef.current) {
            const newPosition = {
                left: controlsRef.current.style.left,
                top: controlsRef.current.style.top,
            };
            localStorage.setItem("selectedBallControlsPosition", JSON.stringify(newPosition));
        }
    }, [position]);


    if (!selectedBall) {
        return null; // Don't render if no ball is selected
    }

    const handleColorChange = (e) => {
        onUpdateSelectedBall({
            ...selectedBall,
            color: e.target.value,
            originalColor: e.target.value, // Update original color too
        });
    };

    const handleSizeChange = (e) => {
        onUpdateSelectedBall({
            ...selectedBall,
            size: parseInt(e.target.value),
            originalSize: parseInt(e.target.value), // Update original size too
        });
    };

    const handleShapeChange = (e) => {
        onUpdateSelectedBall({
            ...selectedBall,
            shape: e.target.value,
        });
    };

    const handleVelocityChange = (e) => {
        const newVelocity = parseInt(e.target.value);
        const currentSpeed = Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY);
        let newVelX = selectedBall.velX;
        let newVelY = selectedBall.velY;

        if (currentSpeed > 0) {
            const ratio = newVelocity / currentSpeed;
            newVelX *= ratio;
            newVelY *= ratio;
        } else {
            // If stationary, give it a random velocity within the new max range
            newVelX = (Math.random() - 0.5) * 2 * newVelocity;
            newVelY = (Math.random() - 0.5) * 2 * newVelocity;
        }

        onUpdateSelectedBall({
            ...selectedBall,
            velX: newVelX,
            velY: newVelY,
        });
    };

    const handleOpacityChange = (e) => {
        onUpdateSelectedBall({
            ...selectedBall,
            opacity: parseFloat(e.target.value),
        });
    };

    return (
        <div ref={controlsRef} className="selected-ball-controls-panel" style={{ left: position.x, top: position.y }}>
            <h3 ref={handleRef} style={{ cursor: 'grab' }}>Selected Ball</h3>
            <details id="section-selected-appearance" open ref={appearanceRef}>
                <summary>Appearance</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>Color:</label>
                        <input type="color" value={selectedBall.color} onChange={handleColorChange} />
                    </div>
                    <div className="control-group">
                        <label>Shape:</label>
                        <select value={selectedBall.shape} onChange={handleShapeChange}>
                            <option value="circle">Circle</option>
                            <option value="square">Square</option>
                            <option value="triangle">Triangle</option>
                            <option value="diamond">Diamond</option>
                            <option value="pentagon">Pentagon</option>
                            <option value="hexagon">Hexagon</option>
                            <option value="octagon">Octagon</option>
                            <option value="star">Star</option>
                        </select>
                    </div>
                    <Slider
                        label="Size"
                        min={10}
                        max={150}
                        step={5}
                        value={selectedBall.size}
                        onChange={handleSizeChange}
                        displayValue={`${selectedBall.size}px`}
                    />
                    <Slider
                        label="Opacity"
                        min={0}
                        max={1}
                        step={0.05}
                        value={selectedBall.opacity}
                        onChange={handleOpacityChange}
                    />
                </div>
            </details>

            <details id="section-selected-motion" ref={motionRef}>
                <summary>Motion</summary>
                <div className="section-body">
                    <Slider
                        label="Velocity"
                        min={1}
                        max={15}
                        step={1}
                        value={Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY)}
                        onChange={handleVelocityChange}
                    />
                    {/* Speed and Speed Multiplier controls would go here */}
                </div>
            </details>

            <details id="section-selected-stats" ref={statsRef}>
                <summary>Stats</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>Collision Count:</label>
                        <span>{selectedBall.collisionCount}</span>
                    </div>
                    <div className="control-group">
                        <label>Health:</label>
                        <span>{Math.round(selectedBall.health)}</span>
                    </div>
                </div>
            </details>

            {/* Actions and Saved Balls sections would go here */}
        </div>
    );
}

export default SelectedBallControls;