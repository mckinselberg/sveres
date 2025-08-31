import React from 'react';

export default function GauntletInstructionsOverlay({ onClose, onReset }) {
  const stop = (e) => e.stopPropagation();
  return (
    <div className="gauntlet-instructions-overlay" onClick={onClose}>
      <div className="intro-card" onClick={stop}>
        <h3>Gravity Gauntlet — Instructions</h3>
        <p>Goal: push all non-player balls into the green goal. If your ball touches the green goal, you lose.</p>
        <ul>
          <li>Move: Arrow keys or WASD (toggle via the WASD button).</li>
          <li>Gas: M or Shift (X-axis boost only). Brake: N.</li>
          <li>Reset level: R key or the Reset button.</li>
          <li>Toggle WASD input via the on-screen button.</li>
        </ul>
        <div className="actions">
          <button onClick={onReset} aria-label="Reset Level">Reset Level</button>
          <button onClick={onClose} aria-label="Close Instructions">Close</button>
        </div>
      </div>
    </div>
  );
}
