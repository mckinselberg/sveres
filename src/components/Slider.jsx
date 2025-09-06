import React from 'react';
import { setSlidersDragging } from '../utils/uiDragState.js';

function Slider({ label, value, onChange, min, max, step, displayValue, logarithmic }) {
    // Coerce numeric inputs to avoid React warnings about NaN/undefined
    const toNumber = (v, fb) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fb;
    };

    const handleLogarithmicChange = (e) => {
        const minp = 0;
        const maxp = 100;
        // Guard against non-positive mins for log scale
        const minSafe = Math.max(1e-6, toNumber(min, 1));
        const maxSafe = Math.max(minSafe + 1e-6, toNumber(max, 100));
        const minv = Math.log(minSafe);
        const maxv = Math.log(maxSafe);
        const scale = (maxv - minv) / (maxp - minp);
        const raw = Math.exp(minv + scale * (e.target.value - minp));
        const clamped = Math.min(maxSafe, Math.max(minSafe, raw));
        const value = Math.round(clamped);
        onChange({ target: { value } });
    };

    const getLogarithmicValue = () => {
        const minp = 0;
        const maxp = 100;
        const minSafe = Math.max(1e-6, toNumber(min, 1));
        const maxSafe = Math.max(minSafe + 1e-6, toNumber(max, 100));
        const minv = Math.log(minSafe);
        const maxv = Math.log(maxSafe);
        const scale = (maxv - minv) / (maxp - minp);
        const v = Math.max(minSafe, Math.min(maxSafe, toNumber(value, minSafe)));
        return (Math.log(v) - minv) / scale + minp;
    };

    const numericMin = toNumber(min, 0);
    const numericMax = toNumber(max, 100);
    const numericStep = toNumber(step, 1) || 1;
    const cleanedValue = logarithmic
        ? getLogarithmicValue()
        : toNumber(value, numericMin);
    const cleanedDisplay = displayValue ?? toNumber(value, numericMin);

    return (
    <div className="control-group" style={{ position: 'relative' }}>
            <label>{label}:</label>
            <input
                type="range"
                min={logarithmic ? 0 : numericMin}
                max={logarithmic ? 100 : numericMax}
                step={numericStep}
                value={cleanedValue}
                onChange={logarithmic ? handleLogarithmicChange : onChange}
                onMouseDown={() => setSlidersDragging(true)}
                onTouchStart={() => { setSlidersDragging(true); /* don’t call preventDefault here to keep details toggles working */ }}
                data-refocus-canvas="true"
                onMouseUp={() => {
                    setSlidersDragging(false);
                    // After releasing the slider, refocus the canvas so game keys work immediately
                    requestAnimationFrame(() => {
                        const cnv = document.querySelector('canvas');
                        if (cnv && typeof cnv.focus === 'function') cnv.focus();
                    });
                }}
                onTouchEnd={() => {
                    setSlidersDragging(false);
                    requestAnimationFrame(() => {
                        const cnv = document.querySelector('canvas');
                        if (cnv && typeof cnv.focus === 'function') cnv.focus();
                    });
                }}
            />
            <span>{cleanedDisplay}</span>
        </div>
    );
}

export default React.memo(Slider);