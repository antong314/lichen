"use client";

import { useRef, useState } from "react";
import { PassDevice } from "./PassDevice";
import { Button } from "./Button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import type { PlannedRound } from "@/lib/rounds";

type Phase = "pass-to-a" | "a-pick" | "pass-to-b" | "b-pick" | "review";

interface Entry {
  player: "a" | "b";
  photoDataUrl: string;
  voiceNoteText: string;
}

export function QuietRound({
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
  const [phase, setPhase] = useState<Phase>("pass-to-a");
  const [entryA, setEntryA] = useState<Entry | null>(null);
  const [entryB, setEntryB] = useState<Entry | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);

  const ensureRound = async () => {
    if (roundId) return roundId;
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ordinal: round.ordinal,
        type: "quiet",
        prompt_id: round.promptId,
        prompt_text: round.promptText,
        answering_player: "a",
        answer_text: "",
      }),
    });
    const json = (await res.json()) as { round_id: string };
    setRoundId(json.round_id);
    return json.round_id;
  };

  const submitEntry = async (entry: Entry) => {
    const rid = await ensureRound();
    await fetch("/api/quiet-entry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        round_id: rid,
        player: entry.player,
        photo_data_url: entry.photoDataUrl,
        voice_note_text: entry.voiceNoteText,
      }),
    });
  };

  if (phase === "pass-to-a") {
    return (
      <PassDevice
        toName={playerAName}
        subtitle={meta ?? "Quiet round — pick a photo"}
        onContinue={() => setPhase("a-pick")}
      />
    );
  }

  if (phase === "a-pick") {
    return (
      <PhotoPicker
        playerName={playerAName}
        partnerName={playerBName}
        prompt={round.promptText}
        onSubmit={async (entry) => {
          const e = { ...entry, player: "a" as const };
          await submitEntry(e);
          setEntryA(e);
          setPhase("pass-to-b");
        }}
      />
    );
  }

  if (phase === "pass-to-b") {
    return (
      <PassDevice toName={playerBName} subtitle="Your turn — pick a photo" onContinue={() => setPhase("b-pick")} />
    );
  }

  if (phase === "b-pick") {
    return (
      <PhotoPicker
        playerName={playerBName}
        partnerName={playerAName}
        prompt={round.promptText}
        onSubmit={async (entry) => {
          const e = { ...entry, player: "b" as const };
          await submitEntry(e);
          setEntryB(e);
          setPhase("review");
        }}
      />
    );
  }

  if (phase === "review" && entryA && entryB) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto items-center">
        <p className="text-xs uppercase tracking-widest text-stone-500">No score this round</p>
        <div className="grid grid-cols-2 gap-4 w-full">
          <PhotoCard entry={entryA} name={playerAName} />
          <PhotoCard entry={entryB} name={playerBName} />
        </div>
        <Button onClick={onComplete}>Continue</Button>
      </div>
    );
  }

  return null;
}

function PhotoCard({ entry, name }: { entry: Entry; name: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <img src={entry.photoDataUrl} alt={`From ${name}`} className="w-full aspect-square object-cover" />
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">{name}</p>
        <p className="text-stone-800 text-sm leading-relaxed">{entry.voiceNoteText}</p>
      </div>
    </div>
  );
}

function PhotoPicker({
  playerName,
  partnerName,
  prompt,
  onSubmit,
}: {
  playerName: string;
  partnerName: string;
  prompt: string;
  onSubmit: (entry: { photoDataUrl: string; voiceNoteText: string }) => Promise<void>;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVoice = async () => {
    if (recorder.state === "idle") await recorder.start();
    else if (recorder.state === "recording") {
      const t = await recorder.stopAndTranscribe();
      if (t) setText((p) => (p ? `${p} ${t}` : t));
    }
  };

  const submit = async () => {
    if (!photo || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ photoDataUrl: photo, voiceNoteText: text.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl w-full mx-auto">
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
        <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Quiet round</p>
        <p className="text-base text-stone-800">{prompt}</p>
      </div>
      {photo ? (
        <img src={photo} alt="picked" className="w-full max-h-80 object-contain rounded-2xl border border-stone-200" />
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()}>
        {photo ? "Pick a different photo" : "Pick a photo"}
      </Button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`What do you see in this photo, about ${partnerName}?`}
        rows={4}
        className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
      />
      {recorder.error ? <p className="text-sm text-rose-600">{recorder.error}</p> : null}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleVoice}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            recorder.state === "recording"
              ? "bg-rose-500 text-white"
              : "bg-stone-200 text-stone-900"
          }`}
        >
          {recorder.state === "recording"
            ? "Stop & transcribe"
            : recorder.state === "transcribing"
            ? "Transcribing…"
            : "🎙 Voice"}
        </button>
        <Button onClick={submit} disabled={!photo || !text.trim() || submitting}>
          {submitting ? "Saving…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
