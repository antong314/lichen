"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function SetupPage() {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!a.trim() || !b.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/couples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player_a_name: a.trim(), player_b_name: b.trim() }),
      });
      if (!res.ok) {
        setError("Could not create. Try again.");
        return;
      }
      const couple = (await res.json()) as { id: string };
      localStorage.setItem("lichen.couple_id", couple.id);
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-md mx-auto w-full">
      <h1 className="font-serif text-6xl tracking-tight mb-4">Lichen</h1>
      <p className="text-stone-600 text-base mb-12 text-center font-serif text-lg italic">
        Two names. To begin.
      </p>
      <div className="flex flex-col gap-4 w-full">
        <div className="relative">
          <span className="absolute -top-2 left-5 bg-stone-50 px-2 text-xs uppercase tracking-widest text-rose-600">
            One of you
          </span>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            autoFocus
            className="w-full rounded-2xl border-2 border-rose-200 bg-white px-5 py-4 text-xl font-serif focus:outline-none focus:border-rose-400"
          />
        </div>
        <div className="relative">
          <span className="absolute -top-2 left-5 bg-stone-50 px-2 text-xs uppercase tracking-widest text-sky-700">
            The other
          </span>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full rounded-2xl border-2 border-sky-200 bg-white px-5 py-4 text-xl font-serif focus:outline-none focus:border-sky-500"
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button onClick={submit} disabled={!a.trim() || !b.trim() || submitting} className="mt-4 text-lg py-4">
          {submitting ? "…" : "Begin"}
        </Button>
      </div>
    </div>
  );
}
