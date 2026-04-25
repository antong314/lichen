"use client";

import type { PlayerSlot } from "@/lib/colors";
import { themeFor } from "@/lib/colors";

export function SessionProgress({
  total,
  current,
  players,
}: {
  total: number;
  current: number;
  /** For each round, which player is "active" (so we can color its dot) */
  players?: Array<PlayerSlot | undefined>;
}) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3 py-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const slot = players?.[i];
        const theme = slot ? themeFor(slot) : null;
        const fill = done && theme ? theme.bg : isCurrent ? "bg-stone-900" : "bg-stone-300";
        return (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${fill} ${
              isCurrent ? "w-8" : "w-2"
            }`}
          />
        );
      })}
    </div>
  );
}
