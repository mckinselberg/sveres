import React from 'react';

export default function GauntletInstructionsOverlay({ onClose, onReset }) {
  const stop = (e) => e.stopPropagation();
  return (
  <div className="gauntlet-instructions-overlay" data-refocus-canvas="true" onClick={onClose}>
      <div className="intro-card" onClick={stop}>
        <h3>Gravity Gauntlet — Instructions</h3>
        <p>Goal: push all non-player balls into the yellow goal. If your ball touches the yellow goal, you lose.</p>
        <ul>
          <li>Gas: M or Shift (X-axis boost only). Brake: N. Jump: J</li>
          <li>Reset level: R key or the Reset button.</li>
          {/* <li>Toggle WASD input via the on-screen button.</li> */}
        </ul>
        <div className="actions">
          <button data-refocus-canvas="true" onClick={onReset} aria-label="Reset Level">Reset Level</button>
          <button data-refocus-canvas="true" onClick={onClose} aria-label="Close Instructions">Close</button>
        </div>
      </div>
    </div>
  );
}
