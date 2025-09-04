import Countdown from './Countdown.jsx';
import Sound from '../utils/sound';

export default function HUDPowerups({ selectedBall }) {
  if (!selectedBall) return null;
  const now = Date.now();
  const items = [];
  if (selectedBall.shieldUntil && selectedBall.shieldUntil > now) {
    items.push({ key: 'shield', label: 'Shield', until: selectedBall.shieldUntil });
  }
  if (selectedBall.speedUntil && selectedBall.speedUntil > now) {
    items.push({ key: 'speed', label: 'Speed', until: selectedBall.speedUntil });
  }
  if (selectedBall.shrinkUntil && selectedBall.shrinkUntil > now) {
    items.push({ key: 'shrink', label: 'Shrink', until: selectedBall.shrinkUntil });
  }
  if (!items.length) return null;
  return (
    <div
      className="hud hud--powerups"
      aria-live="polite"
      style={{
        position: 'fixed', top: 12, left: 12, display: 'flex', gap: 8,
        background: 'rgba(0,0,0,0.35)', padding: '6px 8px', borderRadius: 8,
        pointerEvents: 'none', backdropFilter: 'blur(4px)'
      }}
    >
      {items.map(it => (
        <div key={it.key} className={`hud-pill hud-pill--${it.key}`} style={{ color: 'white', fontSize: 13 }}>
          <span className="hud-pill__name" style={{ marginRight: 6, opacity: 0.9 }}>{it.label}</span>
          <Countdown until={it.until} onExpireBeep={() => Sound.playPowerup('expire')} />
        </div>
      ))}
    </div>
  );
}
