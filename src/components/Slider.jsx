import React from 'react';

function Slider({ label, value, onChange, min, max, step, displayValue }) {
    return (
        <div className="control-group">
            <label>{label}:</label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
            />
            <span>{displayValue || value}</span>
        </div>
    );
}

export default Slider;