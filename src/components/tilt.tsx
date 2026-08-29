import { useRef, type ElementType, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Tilt reads as depth only with a real cursor to drive it; a thumb has nothing to hover with. */
const CURSOR = "(hover: hover) and (pointer: fine)";
const CALM = "(prefers-reduced-motion: reduce)";

type TiltProps = {
  children: ReactNode;
  className?: string;
  /** Rotation at the very edge of the surface. Past about ten degrees the text starts to smear. */
  degrees?: number;
  /** How far the surface rises towards the reader while held. */
  lift?: number;
  as?: "article" | "div" | "figure" | "section";
};

/**
 * A surface that turns to face the cursor, with a deeper shadow and a slight rise to sell the lift.
 *
 * The transform is written to CSS custom properties straight on the node instead of to React state,
 * because a directory grid holds twenty of these and a re-render per pointer move would cost far
 * more than the effect is worth. Every property rests at its identity value, so a surface that is
 * never hovered — or is rendered on the server, or belongs to a reader who asked for less motion —
 * is exactly the flat surface it was before.
 */
export function Tilt({ children, className, degrees = 7, lift = 6, as = "div" }: TiltProps) {
  const Tag = as as ElementType;
  const node = useRef<HTMLElement | null>(null);
  const frame = useRef(0);
  // Resolved once per hover rather than per move, since matchMedia is not free.
  const leaning = useRef(false);

  function lean(event: PointerEvent<HTMLElement>) {
    const element = node.current;
    if (!element || !leaning.current) return;

    const box = element.getBoundingClientRect();
    const across = (event.clientX - box.left) / box.width - 0.5;
    const down = (event.clientY - box.top) / box.height - 0.5;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      /*
       * The corner under the pointer is the corner that comes forward. Both signs look backwards
       * and are not: CSS measures Y downwards, and for rotateX the spec gives z' = y·sin(a), so
       * lifting the top edge towards the reader needs a negative angle. rotateY gives
       * z' = -x·sin(a), so the right edge needs one too.
       */
      element.style.setProperty("--tilt-x", `${down * 2 * degrees}deg`);
      element.style.setProperty("--tilt-y", `${-across * 2 * degrees}deg`);
    });
  }

  function hold(event: PointerEvent<HTMLElement>) {
    const element = node.current;
    if (!element) return;

    leaning.current = window.matchMedia(CURSOR).matches && !window.matchMedia(CALM).matches;
    if (!leaning.current) return;

    // Snap to the cursor quickly while held, so the surface feels attached to the pointer.
    element.style.setProperty("--tilt-ms", "120ms");
    element.style.setProperty("--tilt-lift", `${-lift}px`);
    element.style.setProperty("--tilt-scale", "1.02");
    lean(event);
  }

  function release() {
    const element = node.current;
    leaning.current = false;
    if (!element) return;

    cancelAnimationFrame(frame.current);
    // A longer ease on the way out reads as weight settling rather than a snap back.
    element.style.setProperty("--tilt-ms", "600ms");
    element.style.removeProperty("--tilt-x");
    element.style.removeProperty("--tilt-y");
    element.style.removeProperty("--tilt-lift");
    element.style.removeProperty("--tilt-scale");
  }

  return (
    <Tag
      ref={node}
      className={cn("tilt", className)}
      onPointerEnter={hold}
      onPointerMove={lean}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      {children}
    </Tag>
  );
}
