import { describe, it, expect, beforeEach } from 'vitest';

// Minimal localStorage polyfill for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
}

// Minimal JSDOM-based smoke for showControls localStorage persistence
// We simulate the relevant bits of App: reads ui:showControls on init and toggles it

function loadShowControlsFromStorage() {
  try {
    const raw = localStorage.getItem('ui:showControls');
    return raw ? JSON.parse(raw) : true;
  } catch {
    return true;
  }
}

function saveShowControlsToStorage(v) {
  try { localStorage.setItem('ui:showControls', JSON.stringify(!!v)); } catch (e) { /* noop */ }
}

describe('ui:showControls persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to true when not set', () => {
    expect(loadShowControlsFromStorage()).toBe(true);
  });

  it('toggles and persists across reloads', () => {
    // initial mount
    let showControls = loadShowControlsFromStorage();
    expect(showControls).toBe(true);

    // user toggles off
    showControls = false;
    saveShowControlsToStorage(showControls);

    // simulate reload by re-reading from storage
    const afterReload = loadShowControlsFromStorage();
    expect(afterReload).toBe(false);

    // toggle back on and persist
    saveShowControlsToStorage(true);
    expect(loadShowControlsFromStorage()).toBe(true);
  });
});
