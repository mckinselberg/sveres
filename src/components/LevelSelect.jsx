export default function LevelSelect({ levels, currentLevelId, onChangeLevel, onOpenImport }) {
  return (
    <div className="rc-group">
      <select
        className="rc-button--secondary"
        style={{ width: 220 }}
        value={currentLevelId}
        onChange={(e) => onChangeLevel(e.target.value)}
        aria-label="Select Level"
        title="Select Level"
      >
        {levels.map(l => (
          <option key={l.id} value={l.id}>
            {l.title || l.id}{l.difficulty ? ` · ${l.difficulty}` : ''}
          </option>
        ))}
      </select>
      <button
        data-refocus-canvas="true"
        className="rc-button--utility"
        onClick={onOpenImport}
        aria-label="Import Level JSON from clipboard"
        title="Import custom level from JSON"
      >
        📥 Import JSON
      </button>
    </div>
  );
}
