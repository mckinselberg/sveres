// Spawns a Bullet Hell projectile from a random edge aimed at the player, if due.
// - Uses ctx._nextBulletTime to throttle spawns.
// - Delegates bullet construction to makeBullet(x, y, vx, vy, now) so the caller can
//   set flags and TTL without coupling to Ball or TTL internals here.
export function spawnBulletHellIfDue(ctx, balls, canvasWidth, canvasHeight, physicsSettings, playerBall, makeBullet) {
  if (!playerBall) return;
  const now = performance.now();
  const nextTime = ctx._nextBulletTime || 0;
  if (now < nextTime) return;
  ctx._nextBulletTime = now + 450; // ms

  // Choose a random edge and spawn position
  const edge = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  if (edge === 0) { x = Math.random() * canvasWidth; y = -8; }
  else if (edge === 1) { x = canvasWidth + 8; y = Math.random() * canvasHeight; }
  else if (edge === 2) { x = Math.random() * canvasWidth; y = canvasHeight + 8; }
  else { x = -8; y = Math.random() * canvasHeight; }

  // Aim at the player
  const dx = playerBall.x - x;
  const dy = playerBall.y - y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = Math.max(6, physicsSettings.ballVelocity * 1.2);
  const vx = (dx / len) * speed;
  const vy = (dy / len) * speed;

  const bullet = makeBullet(x, y, vx, vy, now);
  if (bullet) balls.push(bullet);
}
