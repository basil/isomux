import { useRef, useEffect, useState } from "react";

const EDGE_ZONE = 40;
const TRIGGER_THRESHOLD = 100;
const MAX_VERTICAL = 80;

export function useSwipeBack(onBack: () => void, enabled: boolean) {
  const [offsetX, setOffsetX] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "settling" | "exiting">("idle");

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lastDx = useRef(0);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (t.clientX <= EDGE_ZONE) {
        startRef.current = { x: t.clientX, y: t.clientY };
        lastDx.current = 0;
      } else {
        startRef.current = null;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!startRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = Math.abs(t.clientY - startRef.current.y);

      if (dy > MAX_VERTICAL) {
        startRef.current = null;
        lastDx.current = 0;
        setOffsetX(0);
        setPhase("idle");
        return;
      }

      if (dx > 5) {
        e.preventDefault();
        lastDx.current = dx;
        setOffsetX(dx);
        setPhase("dragging");
      }
    }

    function onTouchEnd() {
      if (!startRef.current) return;
      startRef.current = null;
      const dx = lastDx.current;
      lastDx.current = 0;

      if (dx >= TRIGGER_THRESHOLD) {
        // Animate off screen then fire callback
        setPhase("exiting");
        setOffsetX(window.innerWidth);
      } else {
        // Snap back
        setPhase("settling");
        setOffsetX(0);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  // Handle transition end via callback
  const onTransitionEnd = () => {
    if (phase === "exiting") {
      setPhase("idle");
      setOffsetX(0);
      onBackRef.current();
    } else if (phase === "settling") {
      setPhase("idle");
    }
  };

  return { offsetX, phase, onTransitionEnd };
}
