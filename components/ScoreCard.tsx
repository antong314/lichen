import { Hearts } from "./Hearts";
import { themeFor, type PlayerSlot } from "@/lib/colors";

const AXIS_LABEL: Record<string, string> = {
  specificity: "Specificity",
  noticing: "Noticing",
  non_obviousness: "Non-obviousness",
  groundedness: "Groundedness",
  generosity_of_frame: "Reframe",
};

export function ScoreCard({
  hearts,
  axes,
  reason,
  title,
  player,
  animate = true,
}: {
  hearts: number;
  axes: string[];
  reason: string;
  title?: string;
  player?: PlayerSlot;
  animate?: boolean;
}) {
  const theme = player ? themeFor(player) : null;
  return (
    <div className="bg-white rounded-3xl border border-stone-200 px-12 py-14 shadow-sm flex flex-col items-center gap-8 w-full">
      {title ? (
        <p className={`text-sm uppercase tracking-[0.25em] ${theme?.accent ?? "text-stone-500"}`}>
          {title}
        </p>
      ) : null}
      <Hearts
        count={hearts}
        size="xl"
        animate={animate}
        colorClass={theme?.heart ?? "text-rose-500"}
      />
      {axes.length > 0 ? (
        <div
          className="flex flex-wrap justify-center gap-3 animate-fade-in"
          style={{ animationDelay: "1400ms", animationFillMode: "both" }}
        >
          {axes.map((a) => (
            <span
              key={a}
              className={`text-sm uppercase tracking-wider rounded-full px-4 py-1.5 ${
                theme ? `${theme.bgSoft} ${theme.accent}` : "bg-stone-100 text-stone-700"
              }`}
            >
              {AXIS_LABEL[a] ?? a}
            </span>
          ))}
        </div>
      ) : null}
      <p
        className="text-stone-800 leading-relaxed text-center font-serif text-3xl animate-fade-in max-w-3xl"
        style={{ animationDelay: "1600ms", animationFillMode: "both" }}
      >
        {reason}
      </p>
    </div>
  );
}
