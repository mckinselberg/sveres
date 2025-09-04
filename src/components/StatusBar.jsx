
export default function StatusBar({ uiOpacity = 1, levelMode, level, isPaused }) {
  return (
    <div className="status-bar" style={{ opacity: uiOpacity }}>
      <span>Mode: {levelMode ? 'Gravity Gauntlet' : 'Sandbox'}</span>
      {level && (
        <span style={{ marginLeft: 12 }}>
          Level: {level.title || (level.type === 'gravityGauntlet' ? 'Gravity Gauntlet' : level.type)}
          {level.difficulty ? ` · ${level.difficulty}` : ''}
        </span>
      )}
      <span style={{ marginLeft: 12 }}>{isPaused ? 'Paused' : 'Running'}</span>
    </div>
  );
}
