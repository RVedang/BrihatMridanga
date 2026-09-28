/** Lets a vertical swipe scroll the page when it starts on a sideways rail. */
export function bindVerticalPan(el: HTMLElement) {
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let axis: "x" | "y" | null = null;

  const start = (event: TouchEvent) => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    lastY = touch.clientY;
    axis = null;
  };
  const move = (event: TouchEvent) => {
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const touch = event.touches[0];
    if (!axis) {
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      if (dx < 8 && dy < 8) return;
      axis = dy >= dx ? "y" : "x";
    }
    if (axis !== "y") return;
    const scroller = document.scrollingElement;
    if (!scroller) return;
    scroller.scrollTop += lastY - touch.clientY;
    lastY = touch.clientY;
    if (event.cancelable) event.preventDefault();
  };

  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchmove", move, { passive: false });
  return () => {
    el.removeEventListener("touchstart", start);
    el.removeEventListener("touchmove", move);
  };
}
