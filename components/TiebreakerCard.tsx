"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Hearts } from "./Hearts";
import { themeFor, type PlayerSlot } from "@/lib/colors";

export function TiebreakerCard({
  receivingPlayerName,
  receivingPlayerSlot,
  onSubmit,
}: {
  receivingPlayerName: string;
  receivingPlayerSlot?: PlayerSlot;
  onSubmit: (input: { knew: "yes" | "no" | "sort_of"; specificity?: 1 | 2 | 3 }) => Promise<void>;
}) {
  const [knew, setKnew] = useState<"yes" | "no" | "sort_of" | null>(null);
  const [spec, setSpec] = useState<1 | 2 | 3 | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const theme = receivingPlayerSlot ? themeFor(receivingPlayerSlot) : null;

  const submit = async () => {
    if (!knew || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ knew, specificity: spec ?? undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 px-10 py-10 shadow-sm flex flex-col gap-7">
      <div>
        <p className={`text-sm uppercase tracking-[0.25em] mb-3 ${theme?.accent ?? "text-stone-500"}`}>
          For {receivingPlayerName}
        </p>
        <p className="font-serif text-4xl text-stone-900 leading-tight">Did you know they noticed that?</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["no", "sort_of", "yes"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKnew(k)}
            className={`py-5 rounded-2xl border text-base font-medium transition-colors ${
              knew === k
                ? "bg-stone-900 text-stone-50 border-stone-900"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            {k === "no" ? "No, surprised me" : k === "sort_of" ? "Sort of" : "Yes, knew it"}
          </button>
        ))}
      </div>
      <div>
        <p className="text-base text-stone-700 mb-3">How specific was it?</p>
        <div className="flex gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setSpec(n as 1 | 2 | 3)}
              className={`p-4 rounded-2xl border ${
                spec === n
                  ? `${theme?.border ?? "border-rose-400"} ${theme?.bgSoft ?? "bg-rose-50"}`
                  : "border-stone-200 bg-white hover:bg-stone-100"
              }`}
            >
              <Hearts count={n} size="md" colorClass={theme?.heart ?? "text-rose-500"} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!knew || submitting} className="text-lg px-8 py-4">
          {submitting ? "Saving…" : "Done"}
        </Button>
      </div>
    </div>
  );
}
