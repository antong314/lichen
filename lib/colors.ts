// Per-player visual identity. Tailwind v4 scans source for class literals,
// so the strings below must stay verbatim — don't build them dynamically.

export type PlayerSlot = "a" | "b";

export interface PlayerTheme {
  /** Solid bg used for full-screen backgrounds (pass interstitial) */
  bg: string;
  /** Soft tinted bg (cards, badges) */
  bgSoft: string;
  /** Bright text or border accent */
  accent: string;
  /** Heart fill color */
  heart: string;
  /** Border for prompt card left edge */
  border: string;
  /** Hex used inline (for SVG fill, edge band) */
  hex: string;
}

const themes: Record<PlayerSlot, PlayerTheme> = {
  a: {
    bg: "bg-rose-500",
    bgSoft: "bg-rose-50",
    accent: "text-rose-600",
    heart: "text-rose-500",
    border: "border-rose-400",
    hex: "#f43f5e",
  },
  b: {
    bg: "bg-sky-600",
    bgSoft: "bg-sky-50",
    accent: "text-sky-700",
    heart: "text-sky-600",
    border: "border-sky-500",
    hex: "#0284c7",
  },
};

export function themeFor(player: PlayerSlot): PlayerTheme {
  return themes[player];
}
