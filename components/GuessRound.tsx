"use client";

import { useState } from "react";
import { PassDevice } from "./PassDevice";
import { PromptCard } from "./PromptCard";
import { AnswerInput } from "./AnswerInput";
import { ScoreCard } from "./ScoreCard";
import { Hearts } from "./Hearts";
import { Button } from "./Button";
import type { PlannedRound } from "@/lib/rounds";

type Phase =
  | "pass-to-predictor"
  | "predicting"
  | "attention-shown"
  | "pass-to-real"
  | "real-answering"
  | "accuracy-tap"
  | "reason-shown"
  | "exit-ramp";

interface AttentionScore {
  hearts: number;
  axes_fired: string[];
  reason: string;
}

export function GuessRound({
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
  const [phase, setPhase] = useState<Phase>("pass-to-predictor");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [attention, setAttention] = useState<AttentionScore | null>(null);
  const [predictionText, setPredictionText] = useState<string>("");
  const [realAnswer, setRealAnswer] = useState<string>("");
  const [accuracyHearts, setAccuracyHearts] = useState<1 | 2 | 3 | null>(null);
  const [accuracyReason, setAccuracyReason] = useState<string>("");

  const predictingPlayer = round.predictingPlayer ?? "a";
  const partnerPlayer = predictingPlayer === "a" ? "b" : "a";
  const predictorName = predictingPlayer === "a" ? playerAName : playerBName;
  const partnerName = partnerPlayer === "a" ? playerAName : playerBName;

  const submitPrediction = async (text: string) => {
    setPredictionText(text);
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ordinal: round.ordinal,
        type: "guess_the_answer",
        prompt_id: round.promptId,
        prompt_text: round.promptText,
        answering_player: predictingPlayer,
        answer_text: text,
        partner_name: partnerName,
        answering_player_name: predictorName,
      }),
    });
    if (!res.ok) {
      alert("Scoring failed");
      return;
    }
    const json = (await res.json()) as { round_id: string; scores: { attention: AttentionScore } };
    setRoundId(json.round_id);
    setAttention(json.scores.attention);
    setPhase("attention-shown");
  };

  const submitRealAnswer = async (text: string) => {
    setRealAnswer(text);
    setPhase("accuracy-tap");
  };

  const submitAccuracy = async (hearts: 1 | 2 | 3) => {
    setAccuracyHearts(hearts);
    if (!roundId) return;
    const res = await fetch(`/api/rounds/${roundId}/accuracy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        real_answer_text: realAnswer,
        accuracy_hearts: hearts,
        predicting_player_name: predictorName,
        partner_name: partnerName,
      }),
    });
    if (!res.ok) {
      alert("Saving failed");
      return;
    }
    const json = (await res.json()) as { scores: { accuracy: { reason: string } } };
    setAccuracyReason(json.scores.accuracy.reason);
    setPhase(hearts === 1 ? "exit-ramp" : "reason-shown");
  };

  const partnerTheme = partnerPlayer;
  const predictorTheme = predictingPlayer;

  if (phase === "pass-to-predictor") {
    return (
      <PassDevice
        toName={predictorName}
        toPlayer={predictorTheme}
        subtitle={`Guess what ${partnerName} would say`}
        onContinue={() => setPhase("predicting")}
      />
    );
  }

  if (phase === "predicting") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto animate-rise">
        <PromptCard promptText={round.promptText} meta={meta ?? "Guess"} player={predictorTheme} playerName={predictorName} />
        <AnswerInput onSubmit={submitPrediction} submitLabel="That's my guess" player={predictorTheme} />
      </div>
    );
  }

  if (phase === "attention-shown" && attention) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Attention</p>
        <ScoreCard
          hearts={attention.hearts}
          axes={attention.axes_fired}
          reason={attention.reason}
          player={predictorTheme}
        />
        <Button
          onClick={() => setPhase("pass-to-real")}
          className="animate-fade-in"
          style={{ animationDelay: "1900ms", animationFillMode: "both" } as React.CSSProperties}
        >
          Pass to {partnerName}
        </Button>
      </div>
    );
  }

  if (phase === "pass-to-real") {
    return (
      <PassDevice
        toName={partnerName}
        toPlayer={partnerTheme}
        subtitle="Your real answer"
        onContinue={() => setPhase("real-answering")}
      />
    );
  }

  if (phase === "real-answering") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto animate-rise">
        <PromptCard promptText={round.promptText} meta={meta ?? "Your real answer"} player={partnerTheme} playerName={partnerName} />
        <AnswerInput onSubmit={submitRealAnswer} submitLabel="Done" player={partnerTheme} />
      </div>
    );
  }

  if (phase === "accuracy-tap") {
    return (
      <div className="flex flex-col gap-7 max-w-4xl w-full mx-auto animate-rise">
        <div className="bg-white rounded-3xl border border-stone-200 px-8 py-6">
          <p className="text-sm uppercase tracking-[0.25em] text-stone-500 mb-3">{predictorName} guessed</p>
          <p className="font-serif text-3xl text-stone-800 leading-snug">{predictionText}</p>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 px-8 py-6">
          <p className="text-sm uppercase tracking-[0.25em] text-stone-500 mb-3">{partnerName} actually said</p>
          <p className="font-serif text-3xl text-stone-800 leading-snug">{realAnswer}</p>
        </div>
        <p className="text-stone-700 text-xl mt-2">{partnerName} — how close?</p>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => submitAccuracy(n as 1 | 2 | 3)}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              <Hearts count={n} size="lg" />
              <span className="text-sm text-stone-500 uppercase tracking-wider">
                {n === 1 ? "Way off" : n === 2 ? "Partway" : "Spot on"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "reason-shown" && accuracyHearts) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Accuracy</p>
        <Hearts count={accuracyHearts} size="lg" animate colorClass="text-rose-500" />
        <p className="font-serif text-2xl text-stone-800 leading-relaxed text-center max-w-2xl animate-fade-in" style={{ animationDelay: "1500ms", animationFillMode: "both" }}>
          {accuracyReason}
        </p>
        <Button onClick={onComplete} className="animate-fade-in" style={{ animationDelay: "1900ms", animationFillMode: "both" } as React.CSSProperties}>
          Next
        </Button>
      </div>
    );
  }

  if (phase === "exit-ramp") {
    return (
      <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto items-center animate-rise">
        <p className="font-serif text-2xl text-stone-800 leading-relaxed text-center max-w-2xl">
          {accuracyReason}
        </p>
        <Button onClick={onComplete} variant="secondary">
          When ready
        </Button>
      </div>
    );
  }

  return null;
}
