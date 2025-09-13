import React from 'react';

export default function ImportLevelModal({
  open,
  importText,
  importError,
  setImportText,
  onCancel,
  onConfirm,
}) {
  const overlayRef = React.useRef(null);
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, open]);

  React.useEffect(() => {
    if (!open) return;
    // Focus textarea (first input) when opening
    const root = cardRef.current;
    if (!root) return;
    const first = root.querySelector('textarea, button, [href], input, select, [tabindex]:not([tabindex="-1"])');
    if (first && typeof first.focus === 'function') first.focus();
  }, [open]);

  const onOverlayClick = (e) => {
    if (e.target === overlayRef.current) onCancel?.();
  };

  const onKeyDownTrap = (e) => {
    if (e.key !== 'Tab') return;
    const root = cardRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusables);
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    const current = document.activeElement;
    if (e.shiftKey) {
      if (current === first || !root.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (current === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;
  return (
    <div ref={overlayRef} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="importLevelHeading" onClick={onOverlayClick} onKeyDown={onKeyDownTrap}>
      <div ref={cardRef} className="modal-card" role="document">
        <h3 id="importLevelHeading">Import Level JSON</h3>
        <p>Paste a level JSON object below. On import, the current session will use it immediately.</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={'{ "type": "gravityGauntlet", "title": "My Level", "hazards": [], "goals": [], "powerups": [] }'}
          aria-label="Level JSON"
        />
        <div className="error" aria-live="polite">{importError}</div>
        <div className="actions">
          <button data-refocus-canvas="true" className="secondary" onClick={onCancel}>Cancel</button>
          <button data-refocus-canvas="true" onClick={onConfirm}>Import</button>
        </div>
      </div>
    </div>
  );
}
