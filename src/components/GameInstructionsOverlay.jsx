import { useEffect } from 'react';

export default function GameInstructionsOverlay({ onClose, onReset }) {
  const stop = (e) => e.stopPropagation();
  // Close on Escape for accessibility
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
  <div className="game-instructions-overlay" role="dialog" aria-modal="true" aria-label="Game Instructions" data-refocus-canvas="true" onClick={onClose}>
      <div className="intro-card" role="document" onClick={stop}>
        <h3>Game Mode — Instructions</h3>
        <p>Complete structured levels with different objectives and mechanics.</p>
        <ul>
          <li>Move: A/D or Arrow Left/Right</li>
          <li>Boost: hold Shift for extra horizontal thrust</li>
          <li>Jump: Space, W, or Arrow Up</li>
          <li>Slam: disabled in Gauntlet (available in Sandbox/Bullet Hell)</li>
          <li>Pause: P • Reset: R</li>
          <li>Click panel titles to collapse/expand sections</li>
        </ul>
        <div className="actions">
          <button data-refocus-canvas="true" onClick={onReset} aria-label="Reset Level">Reset Level</button>
          <button data-refocus-canvas="true" onClick={onClose} aria-label="Close Instructions">Close</button>
        </div>
      </div>
    </div>
  );
}
