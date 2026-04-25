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
      <h1 className="text-4xl font-medium tracking-tight mb-2">Welcome</h1>
      <p className="text-stone-600 text-base mb-10 text-center">
        Lichen is for two people. Add your names to begin.
      </p>
      <div className="flex flex-col gap-4 w-full">
        <input
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
        />
        <input
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="Their name"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button onClick={submit} disabled={!a.trim() || !b.trim() || submitting}>
          {submitting ? "…" : "Begin"}
        </Button>
      </div>
    </div>
  );
}
