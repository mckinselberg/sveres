import { useMemo } from 'react';
import { resolveLevelPos } from '../utils/levelPositioning.js';

// Memoize resolved hazard/goal positions and a flattened preResolvedStatics array.
// Powerups are intentionally excluded because the physics loop mutates level.powerups
// during pickup; moving them here would require moving that state up as well.
export default function useResolvedStatics(level, canvasWidth, canvasHeight) {
  return useMemo(() => {
    const resolvedHazards = [];
    const resolvedGoals = [];
    if (level) {
      if (level.hazards) {
        for (let i = 0; i < level.hazards.length; i++) {
          const hz = level.hazards[i];
          const p = resolveLevelPos(hz, canvasWidth, canvasHeight);
          resolvedHazards.push({ ...hz, x: p.x, y: p.y });
        }
      }
      if (level.goals) {
        for (let i = 0; i < level.goals.length; i++) {
          const g = level.goals[i];
          const p = resolveLevelPos(g, canvasWidth, canvasHeight);
          resolvedGoals.push({ ...g, x: p.x, y: p.y });
        }
      }
    }
    const preResolvedStatics = [];
    for (let i = 0; i < resolvedHazards.length; i++) {
      const h = resolvedHazards[i];
      preResolvedStatics.push({ x: h.x, y: h.y, size: h.shape === 'circle' ? h.radius : Math.max(h.width, h.height) / 2, shape: h.shape, color: h.color, isStatic: true, type: 'hazard' });
    }
    for (let i = 0; i < resolvedGoals.length; i++) {
      const g = resolvedGoals[i];
      preResolvedStatics.push({ x: g.x, y: g.y, size: g.shape === 'circle' ? g.radius : Math.max(g.width, g.height) / 2, shape: g.shape, color: g.color, isStatic: true, type: 'goal' });
    }

    return { resolvedHazards, resolvedGoals, preResolvedStatics };
  }, [level, canvasWidth, canvasHeight]);
}
