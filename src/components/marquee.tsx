import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type MarqueeProps = {
  items: string[];
  /** One full pass of the strip. Longer rows want longer durations to keep the speed even. */
  seconds?: number;
  reverse?: boolean;
  className?: string;
};

/**
 * A strip of pills that drifts sideways forever.
 *
 * The row is rendered twice and the track slides by exactly half its width, so the copy arrives
 * where the original began and the seam never shows. That only holds if the spacing belongs to the
 * items rather than to a flex gap: a gap would add one extra space between the two groups, half of
 * which lands inside the translation and makes the loop stutter every pass.
 */
export function Marquee({ items, seconds = 46, reverse = false, className }: MarqueeProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("marquee-edges overflow-hidden py-1", className)}>
      <div
        className="marquee-track flex"
        style={
          {
            "--marquee-seconds": `${seconds}s`,
            "--marquee-direction": reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {[false, true].map((duplicate) => (
          <ul
            key={String(duplicate)}
            className="flex shrink-0"
            aria-hidden={duplicate || undefined}
          >
            {items.map((item, index) => (
              // Indexed because callers pad short lists by repeating them to fill the viewport.
              <li
                key={`${item}-${index}`}
                className="me-3 shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm whitespace-nowrap text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
