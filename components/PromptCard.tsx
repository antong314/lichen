export function PromptCard({
  promptText,
  meta,
}: {
  promptText: string;
  meta?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-7 shadow-sm">
      {meta ? <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">{meta}</p> : null}
      <p className="text-2xl leading-snug font-medium text-stone-900">{promptText}</p>
    </div>
  );
}
