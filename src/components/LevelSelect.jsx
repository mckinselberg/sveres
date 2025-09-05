export default function LevelSelect({ levels, currentLevelId, onChangeLevel, onOpenImport }) {
  return (
    <div className="rc-group">
      <select
        className="gauntlet-wasd-toggle"
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
        className="gauntlet-wasd-toggle"
        onClick={onOpenImport}
        aria-label="Import Level JSON from clipboard"
        title="Open Import Level JSON modal"
      >
        Import Level JSON
      </button>
    </div>
  );
}
