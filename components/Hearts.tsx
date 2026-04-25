"use client";

import { useEffect, useState } from "react";

export function Hearts({
  count,
  max = 3,
  size = "md",
  animate = false,
  colorClass = "text-rose-500",
}: {
  count: number;
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  colorClass?: string;
}) {
  const px = size === "sm" ? 18 : size === "xl" ? 110 : size === "lg" ? 56 : 28;
  const [revealed, setRevealed] = useState(animate ? 0 : count);

  useEffect(() => {
    if (!animate) {
      setRevealed(count);
      return;
    }
    setRevealed(0);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= count; i++) {
      timeouts.push(setTimeout(() => setRevealed(i), 250 + i * 380));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [count, animate]);

  return (
    <div className="flex items-center gap-4" aria-label={`${count} of ${max} hearts`}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          filled={i < revealed}
          justFilled={animate && i === revealed - 1}
          size={px}
          colorClass={colorClass}
        />
      ))}
    </div>
  );
}

function Heart({
  filled,
  justFilled,
  size,
  colorClass,
}: {
  filled: boolean;
  justFilled: boolean;
  size: number;
  colorClass: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      className={`${filled ? colorClass : "text-stone-300"} transition-transform duration-300 ${
        filled ? "scale-100" : "scale-90 opacity-70"
      } ${justFilled ? "animate-heart-pop" : ""}`}
    >
      <path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12c-2.5 4.65-9.5 9-9.5 9z" />
    </svg>
  );
}
