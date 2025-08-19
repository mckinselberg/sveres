import React from 'react';

function Slider({ label, value, onChange, min, max, step, displayValue, logarithmic }) {
    const handleLogarithmicChange = (e) => {
        const minp = 0;
        const maxp = 100;
        const minv = Math.log(min);
        const maxv = Math.log(max);
        const scale = (maxv - minv) / (maxp - minp);
        const value = Math.round(Math.exp(minv + scale * (e.target.value - minp)));
        onChange({ target: { value } });
    };

    const getLogarithmicValue = () => {
        const minp = 0;
        const maxp = 100;
        const minv = Math.log(min);
        const maxv = Math.log(max);
        const scale = (maxv - minv) / (maxp - minp);
        return (Math.log(value) - minv) / scale + minp;
    };

    return (
        <div className="control-group">
            <label>{label}:</label>
            <input
                type="range"
                min={logarithmic ? 0 : min}
                max={logarithmic ? 100 : max}
                step={step}
                value={logarithmic ? getLogarithmicValue() : value}
                onChange={logarithmic ? handleLogarithmicChange : onChange}
            />
            <span>{displayValue || value}</span>
        </div>
    );
}

export default Slider;