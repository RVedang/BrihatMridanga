/**
 * A sideways rail must not swallow an up or down swipe.
 * Vertical movement is left to the browser. A clearly sideways swipe
 * moves the rail.
 */
export function bindVerticalPan(el: HTMLElement) {
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let axis: "x" | "y" | null = null;
  let frame = 0;
  let suppressClick = false;

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const start = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    stop();
    const touch = event.touches[0];
    startX = lastX = touch.clientX;
    startY = touch.clientY;
    lastTime = performance.now();
    velocity = 0;
    axis = null;
    suppressClick = false;
  };

  const move = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const touch = event.touches[0];
    if (!axis) {
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? "x" : "y";
    }
    if (axis !== "x") return;
    suppressClick = true;
    const now = performance.now();
    const delta = lastX - touch.clientX;
    velocity = delta / Math.max(now - lastTime, 8);
    lastX = touch.clientX;
    lastTime = now;
    el.scrollLeft += delta;
    if (event.cancelable) event.preventDefault();
  };

  const end = () => {
    if (axis !== "x") return;
    let speed = velocity * 16;
    const glide = () => {
      if (Math.abs(speed) < 0.4) return;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const next = Math.min(max, Math.max(0, el.scrollLeft + speed));
      el.scrollLeft = next;
      if (next <= 0 || next >= max) return;
      speed *= 0.92;
      frame = requestAnimationFrame(glide);
    };
    frame = requestAnimationFrame(glide);
  };

  const click = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchmove", move, { passive: false });
  el.addEventListener("touchend", end);
  el.addEventListener("touchcancel", end);
  el.addEventListener("click", click, true);
  return () => {
    stop();
    el.removeEventListener("touchstart", start);
    el.removeEventListener("touchmove", move);
    el.removeEventListener("touchend", end);
    el.removeEventListener("touchcancel", end);
    el.removeEventListener("click", click, true);
  };
}
