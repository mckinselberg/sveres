// Achievement tracking utilities for bullet hell mode

export function savePerfectRun(levelId, levelTitle) {
  try {
    const achievements = JSON.parse(localStorage.getItem('bulletHell:achievements') || '{}');
    achievements[levelId] = achievements[levelId] || {};
    achievements[levelId].perfectRuns = (achievements[levelId].perfectRuns || 0) + 1;
    achievements[levelId].lastPerfectRun = Date.now();
    achievements[levelId].levelTitle = levelTitle;
    localStorage.setItem('bulletHell:achievements', JSON.stringify(achievements));
    return achievements[levelId].perfectRuns;
  } catch {
    return 0;
  }
}

export function getPerfectRuns(levelId) {
  try {
    const achievements = JSON.parse(localStorage.getItem('bulletHell:achievements') || '{}');
    return achievements[levelId]?.perfectRuns || 0;
  } catch {
    return 0;
  }
}

export function getAllAchievements() {
  try {
    return JSON.parse(localStorage.getItem('bulletHell:achievements') || '{}');
  } catch {
    return {};
  }
}

export function getTotalPerfectRuns() {
  const achievements = getAllAchievements();
  return Object.values(achievements).reduce((total, level) => total + (level.perfectRuns || 0), 0);
}