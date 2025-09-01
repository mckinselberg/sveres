import { useEffect, useState } from 'react';

function Countdown({ until, onExpireBeep }) {
  const [now, setNow] = useState(() => Date.now());
  const [beeped, setBeeped] = useState(false);

  useEffect(() => {
    setBeeped(false);
  }, [until]);

  useEffect(() => {
    let rafId;
    let timerId;
    const tick = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(tick);
    };
    // Use rAF for smooth display; fall back to interval if needed
    rafId = requestAnimationFrame(tick);
    // Safety: also update every 200ms in case tab throttles rAF
    timerId = setInterval(() => setNow(Date.now()), 200);
    return () => { cancelAnimationFrame(rafId); clearInterval(timerId); };
  }, []);

  const remaining = Math.max(0, (until || 0) - now);
  if (remaining <= 1000 && until && !beeped) {
    try { onExpireBeep && onExpireBeep(); } catch {}
    setBeeped(true);
  }
  const secs = (remaining / 1000);
  const text = secs.toFixed(secs < 10 ? 1 : 0) + 's';
  return <span className="hud-pill__time">{text}</span>;
}

export default Countdown;
