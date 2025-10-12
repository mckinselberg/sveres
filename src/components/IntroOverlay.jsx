import { useState, useEffect } from 'react';

function IntroOverlay() {
    const STORAGE_KEY = "introOverlay:lastDismissedAt";
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const now = Date.now();
        const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        const shouldShow = !last || now - last > WEEK_MS;
        if (shouldShow) setIsVisible(true);
        // WEEK_MS is a constant; acceptable to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle Escape to dismiss when visible (unconditional hook; guarded by isVisible)
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') dismiss();
        };
        if (isVisible) {
            window.addEventListener('keydown', onKey);
        }
        return () => {
            window.removeEventListener('keydown', onKey);
        };
    }, [isVisible]);

    const dismiss = () => {
        setIsVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch (e) {
            // noop
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className="intro-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Sveres"
            data-refocus-canvas="true"
            onClick={(e) => e.target.classList.contains('intro-overlay') && dismiss()}
        >
            <div className="intro-card" role="document">
                <h3>Welcome to Sveres</h3>
                <p>Quick tips to get you started:</p>
                <ul>
                    <li>Click panel titles to show/hide sections (Controls, Selected Ball, etc.).</li>
                    <li>Drag on a ball to move it; use WASD or arrow keys to nudge the selected ball.</li>
                    <li>Use the sliders to change size, speed, gravity, and more. Try Deformation for squishy fun.</li>
                    <li>On mobile, panels become bottom sheets and inputs are touch-friendly.</li>
                </ul>
                <h4>Game Mode:</h4>
                <ul>
                    <li>Toggle "GG" mode in the controls to play.</li>
                    <li>The objective is to get all the balls into the green "goal" zones.</li>
                    <li>The first ball is highlighted with a white stroke. This is your starting ball.</li>
                    <li>Avoid the red "hazard" zones, or your balls will take damage and be removed.</li>
                    <li>Use the WASD or arrow keys to control the selected ball. Use N and M to increase or decrease its velocity.</li>
                </ul>
                <div className="actions">
                    <button data-refocus-canvas="true" onClick={dismiss} aria-label="Dismiss intro and return to the simulation">Got it</button>
                </div>
            </div>
        </div>
    );
}

export default IntroOverlay;