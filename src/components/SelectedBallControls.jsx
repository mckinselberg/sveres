import { useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars -- used in JSX
import Slider from './Slider.jsx';
import { usePersistentDetails } from '../hooks/usePersistentDetails.js';

import { rgbToHex } from '../utils/colors.js';

function SelectedBallControls({ selectedBall, onUpdateSelectedBall }) {
    const controlsRef = useRef(null);
    const handleRef = useRef(null);
    const appearanceRef = useRef(null);
    const motionRef = useRef(null);
    const statsRef = useRef(null);
    const controlRef = useRef(null);

    usePersistentDetails([appearanceRef, motionRef, statsRef, controlRef]);

    useEffect(() => {
        if (selectedBall) {
            const savedPosition = JSON.parse(localStorage.getItem("selectedBallControlsPosition"));
            if (savedPosition) {
                controlsRef.current.style.left = savedPosition.left;
                controlsRef.current.style.top = savedPosition.top;
            } else {
                controlsRef.current.style.left = `${window.innerWidth - 320}px`;
                controlsRef.current.style.top = '65px';
            }

            const handleElement = handleRef.current;
            const controlsElement = controlsRef.current;

            let isDragging = false;
            let offsetX, offsetY;

            const onMouseDown = (e) => {
                isDragging = true;
                offsetX = e.clientX - controlsElement.offsetLeft;
                offsetY = e.clientY - controlsElement.offsetTop;
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                const left = e.clientX - offsetX;
                const top = e.clientY - offsetY;
                controlsElement.style.left = `${left}px`;
                controlsElement.style.top = `${top}px`;
            };

            const onMouseUp = () => {
                if (!isDragging) return;
                isDragging = false;
                const position = {
                    left: controlsElement.style.left,
                    top: controlsElement.style.top,
                };
                localStorage.setItem("selectedBallControlsPosition", JSON.stringify(position));
            };

            if (handleElement) {
                handleElement.addEventListener('mousedown', onMouseDown);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }

            return () => {
                if (handleElement) {
                    handleElement.removeEventListener('mousedown', onMouseDown);
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [selectedBall]);

    const handleColorChange = (e) => {
        onUpdateSelectedBall({
            id: selectedBall.id,
            color: e.target.value,
            originalColor: e.target.value,
        });
    };

    const handleSizeChange = (e) => {
        const v = parseInt(e.target.value);
        onUpdateSelectedBall({ id: selectedBall.id, size: v, originalSize: v });
    };

    const handleShapeChange = (e) => {
        onUpdateSelectedBall({ id: selectedBall.id, shape: e.target.value });
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

    onUpdateSelectedBall({ id: selectedBall.id, velX: newVelX, velY: newVelY });
    };

    const handleOpacityChange = (e) => {
    const v = parseFloat(e.target.value);
    onUpdateSelectedBall({ id: selectedBall.id, opacity: Number.isFinite(v) ? v : 1 });
    };

    if (!selectedBall) {
        return null; // Don't render if no ball is selected
    }

    return (
        <div ref={controlsRef} className="selected-ball-controls-panel">
            <h3 ref={handleRef} data-refocus-canvas="true" style={{ cursor: 'grab' }}>Selected Ball</h3>
            <details id="section-selected-appearance" open ref={appearanceRef}>
                <summary>Appearance</summary>
                <div className="section-body">
                    <div className="control-group">
                        <label>Color:</label>
                        <input type="color" value={rgbToHex(selectedBall.color || '#ffffff')} onChange={handleColorChange} />
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
                        value={Number.isFinite(Number(selectedBall.size)) ? Number(selectedBall.size) : 20}
                        onChange={handleSizeChange}
                        displayValue={`${Number.isFinite(Number(selectedBall.size)) ? Number(selectedBall.size) : 20}px`}
                    />
                    <Slider
                        label="Opacity"
                        min={0}
                        max={1}
                        step={0.05}
                        value={Number.isFinite(Number(selectedBall.opacity)) ? Number(selectedBall.opacity) : 1}
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
                        value={(() => {
                            const vx = Number.isFinite(Number(selectedBall.velX)) ? Number(selectedBall.velX) : 0;
                            const vy = Number.isFinite(Number(selectedBall.velY)) ? Number(selectedBall.velY) : 0;
                            const speed = Math.sqrt(vx * vx + vy * vy);
                            return Number.isFinite(speed) ? speed : 0;
                        })()}
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
                        <span>{Number.isFinite(Number(selectedBall.collisionCount)) ? Number(selectedBall.collisionCount) : 0}</span>
                    </div>
                    <div className="control-group">
                        <label>Health:</label>
                        <span>{(() => {
                            const h = Number(selectedBall.health);
                            return Number.isFinite(h) ? Math.round(h) : 0;
                        })()}</span>
                    </div>
                </div>
            </details>

            <details id="section-selected-control" ref={controlRef}>
                <summary>Control Tuning</summary>
                <div className="section-body">
                    <Slider
                        label="Base Max Speed"
                        min={0.5}
                        max={8}
                        step={0.1}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.maxSpeedBase)) ? Number(selectedBall.controlTuning?.maxSpeedBase) : 2.0}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, maxSpeedBase: parseFloat(e.target.value) } })}
                    />
                    <Slider
                        label="Boost Multiplier"
                        min={1}
                        max={4}
                        step={0.1}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.boostMultiplier)) ? Number(selectedBall.controlTuning?.boostMultiplier) : 2.0}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, boostMultiplier: parseFloat(e.target.value) } })}
                    />
                    <Slider
                        label="Acceleration Rate"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.accelRate)) ? Number(selectedBall.controlTuning?.accelRate) : 0.35}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, accelRate: parseFloat(e.target.value) } })}
                    />
                    <Slider
                        label="Accel Boost Multiplier"
                        min={1}
                        max={3}
                        step={0.1}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.accelBoostMultiplier)) ? Number(selectedBall.controlTuning?.accelBoostMultiplier) : 1.4}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, accelBoostMultiplier: parseFloat(e.target.value) } })}
                    />
                    <Slider
                        label="Release Friction"
                        min={0.5}
                        max={0.99}
                        step={0.01}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.releaseFriction)) ? Number(selectedBall.controlTuning?.releaseFriction) : 0.92}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, releaseFriction: parseFloat(e.target.value) } })}
                    />
                    <Slider
                        label="Brake Friction"
                        min={0.3}
                        max={0.95}
                        step={0.01}
                        value={Number.isFinite(Number(selectedBall.controlTuning?.brakeFriction)) ? Number(selectedBall.controlTuning?.brakeFriction) : 0.75}
                        onChange={(e) => onUpdateSelectedBall({ id: selectedBall.id, controlTuning: { ...selectedBall.controlTuning, brakeFriction: parseFloat(e.target.value) } })}
                    />
                </div>
            </details>

            {/* Actions and Saved Balls sections would go here */}
        </div>
    );
}

export default SelectedBallControls;