"use client";

import { useState } from "react";
import { Button } from "./Button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export function AnswerInput({
  onSubmit,
  submitLabel = "Submit",
  placeholder = "Take your time…",
  disabled = false,
}: {
  onSubmit: (text: string) => Promise<void> | void;
  submitLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const recorder = useVoiceRecorder();

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoice = async () => {
    if (recorder.state === "idle") {
      await recorder.start();
    } else if (recorder.state === "recording") {
      const transcribed = await recorder.stopAndTranscribe();
      if (transcribed) {
        setText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={5}
        disabled={disabled || submitting || recorder.state === "transcribing"}
        className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
      />
      {recorder.error ? (
        <p className="text-sm text-rose-600">{recorder.error}</p>
      ) : null}
      <div className="flex items-center gap-3 justify-between">
        <button
          type="button"
          onClick={handleVoice}
          disabled={disabled || submitting || recorder.state === "transcribing"}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            recorder.state === "recording"
              ? "bg-rose-500 text-white hover:bg-rose-600"
              : "bg-stone-200 text-stone-900 hover:bg-stone-300"
          } disabled:opacity-50`}
        >
          {recorder.state === "recording" ? (
            <>
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Stop & transcribe
            </>
          ) : recorder.state === "transcribing" ? (
            "Transcribing…"
          ) : (
            <>🎙 Voice</>
          )}
        </button>
        <Button onClick={handleSubmit} disabled={!text.trim() || submitting || disabled}>
          {submitting ? "Scoring…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
