"use client";

import { useState } from "react";
import { PassDevice } from "./PassDevice";
import { PromptCard } from "./PromptCard";
import { AnswerInput } from "./AnswerInput";
import { Button } from "./Button";
import type { PlannedRound } from "@/lib/rounds";

type Phase = "pass" | "input" | "warning" | "over";

interface Contribution {
  player: "a" | "b";
  playerName: string;
  text: string;
}

export function BuildOnRound({
  round,
  playerAName,
  playerBName,
  sessionId,
  onComplete,
  meta,
}: {
  round: PlannedRound;
  playerAName: string;
  playerBName: string;
  sessionId: string;
  onComplete: () => void;
  meta?: string;
}) {
  const [phase, setPhase] = useState<Phase>("pass");
  const [currentPlayer, setCurrentPlayer] = useState<"a" | "b">("a");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [warnings, setWarnings] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [warningText, setWarningText] = useState<string | null>(null);
  const [winner, setWinner] = useState<"a" | "b" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameOf = (p: "a" | "b") => (p === "a" ? playerAName : playerBName);
  const flip = (p: "a" | "b"): "a" | "b" => (p === "a" ? "b" : "a");

  const handleSubmit = async (text: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt_text: round.promptText,
          contributions,
          new_contribution: { player: currentPlayer, playerName: nameOf(currentPlayer), text },
          warnings_issued: warnings,
        }),
      });
      const result = (await res.json()) as { verdict: "accept" | "warning" | "out"; reason: string };

      if (result.verdict === "accept") {
        setContributions([...contributions, { player: currentPlayer, playerName: nameOf(currentPlayer), text }]);
        setWarningText(null);
        setCurrentPlayer(flip(currentPlayer));
        setPhase("pass");
      } else if (result.verdict === "warning") {
        if (warnings[currentPlayer]) {
          setWinner(flip(currentPlayer));
          setPhase("over");
        } else {
          setWarnings({ ...warnings, [currentPlayer]: true });
          setWarningText(result.reason);
          setPhase("warning");
        }
      } else {
        setWinner(flip(currentPlayer));
        setPhase("over");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tapOut = () => {
    setWinner(flip(currentPlayer));
    setPhase("over");
  };

  const finalize = async () => {
    await fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ordinal: round.ordinal,
        type: "build_on",
        prompt_id: round.promptId,
        prompt_text: round.promptText,
        answering_player: "a",
        answer_text: contributions.map((c) => `${c.playerName}: ${c.text}`).join("\n"),
        scores: { contributions, winner, warnings },
      }),
    });
    onComplete();
  };

  if (phase === "pass") {
    return (
      <PassDevice
        toName={nameOf(currentPlayer)}
        toPlayer={currentPlayer}
        subtitle={meta ?? "Build on"}
        onContinue={() => setPhase("input")}
      />
    );
  }

  if (phase === "input" || phase === "warning") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto animate-rise">
        <PromptCard promptText={round.promptText} meta={meta ?? "Build on — no repeats"} player={currentPlayer} playerName={nameOf(currentPlayer)} />
        {contributions.length > 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 px-8 py-6">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500 mb-4">So far</p>
            <ol className="space-y-3 text-stone-800 text-xl font-serif">
              {contributions.map((c, i) => (
                <li key={i}>
                  <span className="text-stone-400 text-sm font-sans uppercase tracking-wider mr-3">{c.playerName}</span>
                  {c.text}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {warningText ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900">
            <strong>Close call —</strong> {warningText} One more try.
          </div>
        ) : null}
        <AnswerInput onSubmit={handleSubmit} submitLabel="Add" disabled={submitting} player={currentPlayer} />
        <button
          onClick={tapOut}
          className="self-center text-sm text-stone-500 hover:text-stone-700"
        >
          I&apos;m out
        </button>
      </div>
    );
  }

  if (phase === "over" && winner) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Round over</p>
        <h2 className="font-serif text-5xl">{nameOf(winner)} wins</h2>
        <p className="text-stone-600 text-center">
          {contributions.length} contribution{contributions.length === 1 ? "" : "s"} on the table.
        </p>
        <Button onClick={finalize}>Next</Button>
      </div>
    );
  }

  return null;
}
