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

// ----- URL hash encoding/decoding -----
const HASH_KEY = 'sveres';

/**
 * Build a bookmarkable hash from an object: #sveres=<url-encoded-json>
 */
export function buildHashFromObject(obj) {
  try {
    const json = JSON.stringify(obj);
    const enc = encodeURIComponent(json);
    return `#${HASH_KEY}=${enc}`;
  } catch {
    return `#${HASH_KEY}={}`;
  }
}

/** Get the raw hash payload string (without the key prefix), or null if absent. */
export function getHashPayload() {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash || '';
  const prefix = `#${HASH_KEY}=`;
  if (!h.startsWith(prefix)) return null;
  return h.slice(prefix.length);
}

/** Parse the current hash into an object, or null if invalid/missing. */
export function readHashObject() {
  const payload = getHashPayload();
  if (!payload) return null;
  try {
    const json = decodeURIComponent(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Replace or set the current URL hash to reflect the current localStorage snapshot.
 * This does not reload the page, uses history.replaceState for a clean UX.
 */
export function setHashFromLocalStorage(replace = true) {
  if (typeof window === 'undefined') return;
  const snap = snapshotLocalStorage();
  const hash = buildHashFromObject(snap);
  if (replace && window.history && window.history.replaceState) {
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', url);
  } else {
    window.location.hash = hash;
  }
}

/**
 * If the URL hash contains a sveres snapshot, write it into localStorage.
 * Returns true if seeding happened.
 */
export function seedLocalStorageFromHash() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const obj = readHashObject();
  if (!obj || typeof obj !== 'object') return false;
  try {
    for (const [k, v] of Object.entries(obj)) {
      try {
        window.localStorage.setItem(k, JSON.stringify(v));
      } catch {
        // skip problem keys
      }
    }
    return true;
  } catch {
    return false;
  }
}

export default {
  snapshotLocalStorage,
  localStorageToJSONString,
  downloadLocalStorageJSON,
  buildHashFromObject,
  getHashPayload,
  readHashObject,
  setHashFromLocalStorage,
  seedLocalStorageFromHash,
};
