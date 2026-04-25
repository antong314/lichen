"use client";

import { useState } from "react";
import { PassDevice } from "./PassDevice";
import { PromptCard } from "./PromptCard";
import { AnswerInput } from "./AnswerInput";
import { ScoreCard } from "./ScoreCard";
import { TiebreakerCard } from "./TiebreakerCard";
import { Button } from "./Button";
import type { PlannedRound } from "@/lib/rounds";

type Phase = "pass-to-answerer" | "answering" | "scoring" | "tiebreaker" | "tiebreaker-result";

interface ScoreState {
  hearts: number;
  axes_fired: string[];
  reason: string;
}

export function ScoredRound({
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
  const [phase, setPhase] = useState<Phase>("pass-to-answerer");
  const [score, setScore] = useState<ScoreState | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);

  const answeringPlayer = round.answeringPlayer ?? "a";
  const partnerPlayer = answeringPlayer === "a" ? "b" : "a";
  const answererName = answeringPlayer === "a" ? playerAName : playerBName;
  const partnerName = answeringPlayer === "a" ? playerBName : playerAName;

  const handleAnswer = async (text: string) => {
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ordinal: round.ordinal,
        type: round.type,
        prompt_id: round.promptId,
        prompt_text: round.promptText,
        answering_player: answeringPlayer,
        answer_text: text,
        partner_name: partnerName,
        answering_player_name: answererName,
      }),
    });
    if (!res.ok) {
      alert("Scoring failed. Try again.");
      return;
    }
    const json = (await res.json()) as { round_id: string; scores: ScoreState };
    setRoundId(json.round_id);
    setScore(json.scores);
    setPhase("scoring");
  };

  const handleTiebreaker = async (input: { knew: "yes" | "no" | "sort_of"; specificity?: 1 | 2 | 3 }) => {
    if (!roundId) return;
    const res = await fetch(`/api/rounds/${roundId}/tiebreaker`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      alert("Saving failed");
      return;
    }
    const json = (await res.json()) as { scores: ScoreState };
    setScore(json.scores);
    setPhase("tiebreaker-result");
  };

  if (phase === "pass-to-answerer") {
    return (
      <PassDevice
        toName={answererName}
        toPlayer={answeringPlayer}
        subtitle={meta}
        onContinue={() => setPhase("answering")}
      />
    );
  }

  if (phase === "answering") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto animate-rise">
        <PromptCard promptText={round.promptText} meta={meta} player={answeringPlayer} playerName={answererName} />
        <AnswerInput onSubmit={handleAnswer} submitLabel="Done" player={answeringPlayer} />
      </div>
    );
  }

  if (phase === "scoring" && score) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <ScoreCard
          hearts={score.hearts}
          axes={score.axes_fired}
          reason={score.reason}
          player={answeringPlayer}
        />
        <Button
          onClick={() => setPhase("tiebreaker")}
          className="animate-fade-in"
          style={{ animationDelay: "1900ms", animationFillMode: "both" } as React.CSSProperties}
        >
          Pass to {partnerName}
        </Button>
      </div>
    );
  }

  if (phase === "tiebreaker") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto animate-rise">
        <PromptCard promptText={round.promptText} meta={meta} player={partnerPlayer} playerName={partnerName} />
        <TiebreakerCard
          receivingPlayerName={partnerName}
          receivingPlayerSlot={partnerPlayer}
          onSubmit={handleTiebreaker}
        />
      </div>
    );
  }

  if (phase === "tiebreaker-result" && score) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <ScoreCard
          hearts={score.hearts}
          axes={score.axes_fired}
          reason={score.reason}
          title="Final"
          player={answeringPlayer}
        />
        <Button
          onClick={onComplete}
          className="animate-fade-in"
          style={{ animationDelay: "1900ms", animationFillMode: "both" } as React.CSSProperties}
        >
          Next
        </Button>
      </div>
    );
  }

  return null;
}
