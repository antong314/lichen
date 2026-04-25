"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Hearts } from "./Hearts";

export function TiebreakerCard({
  receivingPlayerName,
  onSubmit,
}: {
  receivingPlayerName: string;
  onSubmit: (input: { knew: "yes" | "no" | "sort_of"; specificity?: 1 | 2 | 3 }) => Promise<void>;
}) {
  const [knew, setKnew] = useState<"yes" | "no" | "sort_of" | null>(null);
  const [spec, setSpec] = useState<1 | 2 | 3 | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-7 shadow-sm flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">For {receivingPlayerName}</p>
        <p className="text-lg text-stone-900">Did you know they had noticed that?</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["no", "sort_of", "yes"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKnew(k)}
            className={`py-3 rounded-2xl border text-sm font-medium transition-colors ${
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
        <p className="text-sm text-stone-700 mb-2">How specific was it?</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setSpec(n as 1 | 2 | 3)}
              className={`p-3 rounded-2xl border ${
                spec === n
                  ? "border-rose-400 bg-rose-50"
                  : "border-stone-200 bg-white hover:bg-stone-100"
              }`}
            >
              <Hearts count={n} size="sm" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!knew || submitting}>
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
