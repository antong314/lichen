"use client";

import { useEffect, useState } from "react";
import { themeFor, type PlayerSlot } from "@/lib/colors";

export function PassDevice({
  toName,
  toPlayer,
  subtitle,
  onContinue,
}: {
  toName: string;
  toPlayer: PlayerSlot;
  subtitle?: string;
  onContinue: () => void;
}) {
  const theme = themeFor(toPlayer);
  const [armed, setArmed] = useState(false);

  // Don't trigger onContinue until the slide-up has settled.
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={armed ? onContinue : undefined}
      onKeyDown={(e) => armed && e.key === "Enter" && onContinue()}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer text-white animate-sweep-up ${theme.bg}`}
    >
      <p className="opacity-70 text-xs uppercase tracking-[0.3em] mb-6 animate-fade-in">
        Pass to
      </p>
      <h2
        className="font-serif text-7xl tracking-tight animate-rise"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        {toName}
      </h2>
      {subtitle ? (
        <p
          className="opacity-80 text-base mt-4 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "both" }}
        >
          {subtitle}
        </p>
      ) : null}
      <p
        className="absolute bottom-12 opacity-50 text-xs uppercase tracking-widest animate-fade-in"
        style={{ animationDelay: "700ms", animationFillMode: "both" }}
      >
        Tap anywhere
      </p>
    </div>
  );
}
