import { themeFor, type PlayerSlot } from "@/lib/colors";

export function PromptCard({
  promptText,
  meta,
  player,
  playerName,
}: {
  promptText: string;
  meta?: string;
  player?: PlayerSlot;
  playerName?: string;
}) {
  const theme = player ? themeFor(player) : null;
  return (
    <div
      className={`relative bg-white rounded-3xl border border-stone-200 pl-16 pr-12 py-14 shadow-sm overflow-hidden`}
    >
      {/* Thick color band along the left edge */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-3 ${theme ? theme.bg : "bg-stone-300"}`}
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {playerName && theme ? (
          <span
            className={`inline-flex items-center text-sm font-medium uppercase tracking-[0.2em] rounded-full px-4 py-1.5 ${theme.bg} text-white`}
          >
            {playerName}
          </span>
        ) : null}
        {meta ? (
          <span className="text-sm uppercase tracking-[0.25em] text-stone-500">{meta}</span>
        ) : null}
      </div>

      <p className="font-serif text-5xl leading-[1.15] text-stone-900">{promptText}</p>
    </div>
  );
}
