export default function GameControlsPanel({
  uiOpacity = 1,
  levelMode,
  wasdEnabled,
  onToggleWasd,
  onResetGauntlet,
  onShowInstructions,
  onJump,
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
            className="gauntlet-reset-button"
            onClick={onResetGauntlet}
            aria-label="Reset Gauntlet Level"
            title="Reset Level"
          >
            ↻ Reset
          </button>
          <button
            data-refocus-canvas="true"
            className="gauntlet-wasd-toggle"
            onClick={onToggleWasd}
            aria-label="Toggle WASD input"
            title="Toggle WASD input"
          >
            {wasdEnabled ? 'WASD: On' : 'WASD: Off'}
          </button>
        </div>
      )}
      {levelMode && (
        <div className="rc-group">
          <button
            data-refocus-canvas="true"
            className="gauntlet-wasd-toggle"
            onClick={onShowInstructions}
            aria-label="Show Gauntlet Instructions"
            title="Show Gauntlet Instructions"
          >
            Instructions
          </button>
          <button
            data-refocus-canvas="true"
            className="gauntlet-wasd-toggle"
            onClick={onJump}
            aria-label="Jump"
            title="Jump (Space/J)"
          >
            Jump
          </button>
        </div>
      )}
      <div className="rc-group">
        <button
          data-refocus-canvas="true"
          className="gauntlet-wasd-toggle"
          onClick={onShareURL}
          aria-label="Append settings hash to URL"
          title="Append settings hash to URL for bookmarking/sharing"
        >
          Share URL
        </button>
        {levelMode && (
          <button
            data-refocus-canvas="true"
            className="gauntlet-wasd-toggle"
            onClick={onExportLevel}
            aria-label="Export Level JSON"
            title="Copy current level JSON to clipboard"
          >
            Export Level JSON
          </button>
        )}
      </div>
      {levelMode && levelSelectNode}
    </div>
  );
}
