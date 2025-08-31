// Utilities for exporting localStorage contents as JSON

/**
 * Collect all keys from window.localStorage into a plain object.
 * Values are JSON-parsed when possible, else kept as strings.
 * @returns {Record<string, any>} A snapshot of localStorage.
 */
export function snapshotLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const out = {};
  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key) continue;
      const raw = ls.getItem(key);
      if (raw == null) { out[key] = null; continue; }
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    }
  } catch {
    // best-effort snapshot; ignore
  }
  return out;
}

/**
 * Build a JSON string representation of all localStorage values.
 * @param {number|null} space JSON stringify spacing (default 2, null for compact)
 * @returns {string}
 */
export function localStorageToJSONString(space = 2) {
  const obj = snapshotLocalStorage();
  try {
    return JSON.stringify(obj, null, space == null ? undefined : space);
  } catch {
    // Fallback simple stringify
    return '{}';
  }
}

/**
 * Trigger a client-side download of the current localStorage as a JSON file.
 * @param {string} filename The filename to download as (default: localStorage-export.json)
 * @param {number|null} space JSON stringify spacing (default 2)
 */
export function downloadLocalStorageJSON(filename = 'localStorage-export.json', space = 2) {
  if (typeof document === 'undefined') return;
  const json = localStorageToJSONString(space);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default {
  snapshotLocalStorage,
  localStorageToJSONString,
  downloadLocalStorageJSON,
};
