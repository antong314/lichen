"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

interface Couple {
  id: string;
  player_a_name: string;
  player_b_name: string;
}

export default function Home() {
  const router = useRouter();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("lichen.couple_id") : null;
    if (!id) {
      router.replace("/setup");
      return;
    }
    fetch(`/api/couples/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          localStorage.removeItem("lichen.couple_id");
          router.replace("/setup");
          return null;
        }
        return (await r.json()) as Couple;
      })
      .then((c) => {
        if (c) setCouple(c);
        setLoading(false);
      });
  }, [router]);

  if (loading || !couple) {
    return <div className="flex-1 flex items-center justify-center text-stone-500">…</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-xl mx-auto w-full">
      <h1 className="font-serif text-7xl tracking-tight mb-4">Lichen</h1>
      <p className="text-stone-500 text-sm uppercase tracking-[0.3em] mb-16">
        <span className="text-rose-600">{couple.player_a_name}</span>
        <span className="mx-3 text-stone-400">&</span>
        <span className="text-sky-700">{couple.player_b_name}</span>
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => router.push("/session")} className="text-lg py-4">Play</Button>
        <Link href="/settings" className="text-center text-stone-500 hover:text-stone-800 text-sm py-3">
          Memory &amp; settings
        </Link>
      </div>
    </div>
  );
}
