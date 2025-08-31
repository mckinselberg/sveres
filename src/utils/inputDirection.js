// Decide the X direction for gas acceleration
// Returns -1 (left), 1 (right), or 0 (no decision)
export function decideGasDir({ hasLeft, hasRight, gas, velSign, activeDir, lastMotionDir }) {
  const epsilon = 0.001;
  const vSign = Math.abs(velSign) < epsilon ? 0 : Math.sign(velSign);
  const inputExclusiveDir = hasLeft && !hasRight ? -1 : hasRight && !hasLeft ? 1 : 0;

  if (gas) {
    // Prefer instantaneous motion if moving; else fall back to inputs
    return vSign || inputExclusiveDir || activeDir || lastMotionDir || 0;
  }
  // Without gas, only react to explicit input; otherwise leave physics untouched
  return inputExclusiveDir || activeDir || 0;
}

// Utility to compute exclusive input dir from held keys
export function exclusiveInputDir({ hasLeft, hasRight }) {
  return hasLeft && !hasRight ? -1 : hasRight && !hasLeft ? 1 : 0;
}