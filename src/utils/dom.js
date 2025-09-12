export function getControlsPanel() {
    return document.querySelector('.controls-panel');
}

// Lightweight UI-drag state used to short-circuit panel collision math during slider/resize drags
let _uiDragCount = 0;
export function beginUiDrag() {
    _uiDragCount++;
}
export function endUiDrag() {
    _uiDragCount = Math.max(0, _uiDragCount - 1);
}
export function isUiDragging() {
    return _uiDragCount > 0;
}
