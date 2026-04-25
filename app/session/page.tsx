"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScoredRound } from "@/components/ScoredRound";
import { BuildOnRound } from "@/components/BuildOnRound";
import { GuessRound } from "@/components/GuessRound";
import { QuietRound } from "@/components/QuietRound";
import { Button } from "@/components/Button";
import type { PlannedRound } from "@/lib/rounds";

interface Couple {
  player_a_name: string;
  player_b_name: string;
}

interface SessionResp {
  session_id: string;
  plan: PlannedRound[];
  couple: Couple;
}

const ROUND_DISPLAY: Record<string, string> = {
  admiration: "Admire",
  generosity_of_frame: "Reframe",
  build_on: "Build on",
  memory: "Memory",
  guess_the_answer: "Guess",
  quiet: "Quiet",
};

export default function SessionPage() {
  const router = useRouter();
  const [data, setData] = useState<SessionResp | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const coupleId = localStorage.getItem("lichen.couple_id");
    if (!coupleId) {
      router.replace("/setup");
      return;
    }
    fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ couple_id: coupleId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          setError("Could not start session");
          return null;
        }
        return (await r.json()) as SessionResp;
      })
      .then((d) => d && setData(d));
  }, [router]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-700">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/")}>Back</Button>
      </div>
    );
  }

  if (!data) {
    return <div className="flex-1 flex items-center justify-center text-stone-500">Starting…</div>;
  }

  if (done) {
    return <SessionSummary data={data} />;
  }

  const round = data.plan[currentIdx];
  const meta = `${ROUND_DISPLAY[round.type] ?? round.type} · Round ${currentIdx + 1} of ${data.plan.length}`;

  const advance = async () => {
    if (currentIdx < data.plan.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      await fetch(`/api/sessions/${data.session_id}/end`, { method: "POST" });
      setDone(true);
    }
  };

  const common = {
    round,
    playerAName: data.couple.player_a_name,
    playerBName: data.couple.player_b_name,
    sessionId: data.session_id,
    onComplete: advance,
    meta,
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 w-full">
      {(round.type === "admiration" || round.type === "generosity_of_frame" || round.type === "memory") && (
        <ScoredRound key={currentIdx} {...common} />
      )}
      {round.type === "build_on" && <BuildOnRound key={currentIdx} {...common} />}
      {round.type === "guess_the_answer" && <GuessRound key={currentIdx} {...common} />}
      {round.type === "quiet" && <QuietRound key={currentIdx} {...common} />}
    </div>
  );
}

function SessionSummary({ data }: { data: SessionResp }) {
  const router = useRouter();
  const [rounds, setRounds] = useState<Array<{ ordinal: number; type: string; scores: { hearts?: number; reason?: string; attention?: { hearts: number; reason: string }; accuracy?: { hearts: number; reason: string } } }>>([]);

  useEffect(() => {
    fetch(`/api/sessions/${data.session_id}`)
      .then((r) => r.json())
      .then((j) => setRounds(j.rounds ?? []));
  }, [data.session_id]);

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-xl mx-auto w-full">
      <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Session complete</p>
      <h1 className="text-3xl font-medium mb-8">Five rounds. Done.</h1>
      <ol className="flex flex-col gap-4 w-full mb-12">
        {rounds.map((r) => {
          const display = ROUND_DISPLAY[r.type] ?? r.type;
          let summary = "";
          if (r.type === "guess_the_answer") {
            summary = `Attention: ${r.scores.attention?.hearts ?? "—"}♥, accuracy: ${r.scores.accuracy?.hearts ?? "—"}♥`;
          } else if (r.type === "quiet") {
            summary = "No score";
          } else if (r.type === "build_on") {
            summary = "Build-on round";
          } else {
            summary = `${r.scores.hearts ?? "—"}♥ — ${r.scores.reason ?? ""}`;
          }
          return (
            <li key={r.ordinal} className="bg-white rounded-2xl border border-stone-200 px-5 py-4">
              <div className="text-xs uppercase tracking-widest text-stone-500 mb-1">
                Round {r.ordinal} · {display}
              </div>
              <div className="text-stone-800 text-sm">{summary}</div>
            </li>
          );
        })}
      </ol>
      <Button onClick={() => router.push("/")}>Done</Button>
    </div>
  );
}
