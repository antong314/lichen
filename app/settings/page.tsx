"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

interface MemoryEntry {
  id: string;
  kind: "glossary" | "pattern" | "reference";
  content: string;
  created_at: string;
}

const KIND_LABEL: Record<string, string> = {
  glossary: "Glossary",
  pattern: "Pattern",
  reference: "Reference",
};

export default function SettingsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("lichen.couple_id");
    if (!id) {
      router.replace("/setup");
      return;
    }
    setCoupleId(id);
    fetch(`/api/memory?couple_id=${id}`)
      .then((r) => r.json())
      .then((rows) => {
        setEntries(rows);
        setLoading(false);
      });
  }, [router]);

  const remove = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const wipeAll = async () => {
    if (!coupleId) return;
    if (!confirm("Delete all data for this couple? This cannot be undone.")) return;
    await fetch(`/api/couples/${coupleId}`, { method: "DELETE" });
    localStorage.removeItem("lichen.couple_id");
    router.replace("/setup");
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-12 max-w-xl mx-auto w-full">
      <Link href="/" className="text-sm text-stone-500 mb-6 hover:text-stone-800">
        ← Home
      </Link>
      <h1 className="text-3xl font-medium mb-2">Memory</h1>
      <p className="text-stone-600 text-sm mb-8">
        Things Lichen has noticed about you. Delete any entry you don&apos;t want it to remember.
      </p>

      {loading ? (
        <p className="text-stone-500">…</p>
      ) : entries.length === 0 ? (
        <p className="text-stone-500 text-sm">
          Nothing yet. Memory entries appear after you play a few rounds.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 mb-12">
          {entries.map((e) => (
            <li key={e.id} className="bg-white border border-stone-200 rounded-2xl px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-500 mb-1">
                  {KIND_LABEL[e.kind]}
                </div>
                <div className="text-stone-800">{e.content}</div>
              </div>
              <button
                onClick={() => remove(e.id)}
                className="text-stone-400 hover:text-rose-600 text-sm"
                aria-label="Delete entry"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-stone-200 pt-8 mt-auto">
        <h2 className="text-sm uppercase tracking-widest text-stone-500 mb-3">Danger zone</h2>
        <Button variant="ghost" onClick={wipeAll} className="text-rose-600 hover:bg-rose-50">
          Delete all data for this couple
        </Button>
      </div>
    </div>
  );
}
