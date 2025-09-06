// Shared UI panel state to avoid per-frame DOM reads.
// Coordinates are in CSS pixels.

let _visible = false;
let _width = 0; // current panel width in CSS px
let _left = 0; // fixed at 0 for our layout
let _top = 0;  // fixed at 0 for our layout

export function setControlsVisible(v) {
  _visible = !!v;
}

export function setControlsPanelWidth(w) {
  const n = Math.max(0, Number(w) || 0);
  _width = n;
}

// Optional explicit setter if layout changes in future
export function setControlsPanelRect({ left = 0, top = 0, width = _width }) {
  _left = Number(left) || 0;
  _top = Number(top) || 0;
  _width = Math.max(0, Number(width) || 0);
}

export function getControlsPanelRect(viewportHeight) {
  if (!_visible || _width <= 0) return null;
  const h = Math.max(0, Number(viewportHeight) || (typeof window !== 'undefined' ? window.innerHeight : 0));
  return {
    left: _left,
    top: _top,
    right: _left + _width,
    bottom: _top + h,
  };
}
