// Minimal shared state to indicate when UI sliders are actively being dragged.
// The render loop can use this to skip expensive DOM reads/collisions during scrubs.
let __slidersDragging = false;

export function setSlidersDragging(v) {
  __slidersDragging = !!v;
}

export function isSlidersDragging() {
  return __slidersDragging;
}
