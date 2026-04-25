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

  if (phase === "pass-to-predictor") {
    return (
      <PassDevice
        toName={predictorName}
        subtitle={meta ?? `Predict what ${partnerName} would say`}
        onContinue={() => setPhase("predicting")}
      />
    );
  }

  if (phase === "predicting") {
    return (
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto">
        <PromptCard promptText={round.promptText} meta={meta ?? "Guess"} />
        <p className="text-stone-600 text-sm">
          {predictorName}, predict what {partnerName} would actually say.
        </p>
        <AnswerInput onSubmit={submitPrediction} submitLabel="Submit prediction" />
      </div>
    );
  }

  if (phase === "attention-shown" && attention) {
    return (
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto items-center">
        <p className="text-xs uppercase tracking-widest text-stone-500">Attention score</p>
        <ScoreCard hearts={attention.hearts} axes={attention.axes_fired} reason={attention.reason} />
        <p className="text-sm text-stone-600 text-center max-w-md">
          Accuracy comes next — pass to {partnerName} for their real answer.
        </p>
        <Button onClick={() => setPhase("pass-to-real")}>Pass to {partnerName}</Button>
      </div>
    );
  }

  if (phase === "pass-to-real") {
    return (
      <PassDevice
        toName={partnerName}
        subtitle="Answer the prompt yourself"
        onContinue={() => setPhase("real-answering")}
      />
    );
  }

  if (phase === "real-answering") {
    return (
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto">
        <PromptCard promptText={round.promptText} meta={meta ?? "Guess — your real answer"} />
        <p className="text-stone-600 text-sm">{partnerName}, what's your real answer?</p>
        <AnswerInput onSubmit={submitRealAnswer} submitLabel="Submit" />
      </div>
    );
  }

  if (phase === "accuracy-tap") {
    return (
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">{predictorName}'s prediction</p>
          <p className="text-stone-800">{predictionText}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">{partnerName}'s real answer</p>
          <p className="text-stone-800">{realAnswer}</p>
        </div>
        <p className="text-stone-700 text-base">{partnerName}, how close did they get?</p>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => submitAccuracy(n as 1 | 2 | 3)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              <Hearts count={n} size="md" />
              <span className="text-xs text-stone-500">
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
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto items-center">
        <p className="text-xs uppercase tracking-widest text-stone-500">Accuracy</p>
        <Hearts count={accuracyHearts} size="lg" />
        <p className="text-stone-700 text-base leading-relaxed text-center max-w-md">{accuracyReason}</p>
        <Button onClick={onComplete}>Continue</Button>
      </div>
    );
  }

  if (phase === "exit-ramp") {
    return (
      <div className="flex flex-col gap-6 max-w-xl w-full mx-auto items-center">
        <p className="text-stone-700 text-base leading-relaxed text-center max-w-md">{accuracyReason}</p>
        <Button onClick={onComplete} variant="secondary">
          Tap when ready
        </Button>
      </div>
    );
  }

  return null;
}
