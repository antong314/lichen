import { Hearts } from "./Hearts";

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
}: {
  hearts: number;
  axes: string[];
  reason: string;
  title?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-7 shadow-sm flex flex-col items-center gap-4">
      {title ? <p className="text-xs uppercase tracking-widest text-stone-500">{title}</p> : null}
      <Hearts count={hearts} size="lg" />
      {axes.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {axes.map((a) => (
            <span
              key={a}
              className="text-xs uppercase tracking-wider text-stone-700 bg-stone-100 rounded-full px-3 py-1"
            >
              {AXIS_LABEL[a] ?? a}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-stone-700 text-base leading-relaxed text-center max-w-md">{reason}</p>
    </div>
  );
}
