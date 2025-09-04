
export default function ImportLevelModal({
  open,
  importText,
  importError,
  setImportText,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Import Level JSON</h3>
        <p>Paste a level JSON object below. On import, the current session will use it immediately.</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={'{ "type": "gravityGauntlet", "title": "My Level", "hazards": [], "goals": [], "powerups": [] }'}
          aria-label="Level JSON"
        />
        <div className="error" aria-live="polite">{importError}</div>
        <div className="actions">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Import</button>
        </div>
      </div>
    </div>
  );
}
