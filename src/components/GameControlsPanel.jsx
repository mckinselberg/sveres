export default function GameControlsPanel({
  uiOpacity = 1,
  levelMode,
  onResetGauntlet,
  onShowInstructions,
  onShareURL,
  onExportLevel,
  levelSelectNode,
}) {
  return (
    <div className="right-controls" style={{ opacity: uiOpacity }}>
      {levelMode && (
        <div className="rc-group">
          <button
            data-refocus-canvas="true"
            className="rc-button--primary"
            onClick={onResetGauntlet}
            aria-label="Reset Level - Keyboard: R"
            title="Reset Level (R)"
          >
            ↻ Reset <span className="kbd-hint">R</span>
          </button>
          <button
            data-refocus-canvas="true"
            className="rc-button--secondary"
            onClick={onShowInstructions}
            aria-label="Show Game Instructions"
            title="Show Game Instructions"
          >
            📖 Instructions
          </button>
        </div>
      )}
      <div className="rc-group">
        <button
          data-refocus-canvas="true"
          className="rc-button--utility"
          onClick={onShareURL}
          aria-label="Append settings hash to URL"
          title="Copy shareable URL to clipboard"
        >
          🔗 Share URL
        </button>
        {levelMode && (
          <button
            data-refocus-canvas="true"
            className="rc-button--utility"
            onClick={onExportLevel}
            aria-label="Export Level JSON"
            title="Copy current level JSON to clipboard"
          >
            📄 Export JSON
          </button>
        )}
      </div>
      {levelMode && levelSelectNode}
    </div>
  );
}
