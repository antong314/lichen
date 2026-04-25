"use client";

import { useCallback, useRef, useState } from "react";

export interface VoiceRecorder {
  state: "idle" | "recording" | "transcribing";
  start: () => Promise<void>;
  stopAndTranscribe: () => Promise<string | null>;
  cancel: () => void;
  error: string | null;
}

export function useVoiceRecorder(): VoiceRecorder {
  const [state, setState] = useState<VoiceRecorder["state"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = mr;
      mr.start();
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone access failed");
    }
  }, []);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const mr = recorderRef.current;
    if (!mr) return null;
    setState("transcribing");
    const blob: Blob = await new Promise((resolve) => {
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      mr.stop();
    });
    cleanup();
    try {
      const form = new FormData();
      form.append("audio", new File([blob], "audio.webm", { type: "audio/webm" }));
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        setError("Transcription failed");
        setState("idle");
        return null;
      }
      const json = (await res.json()) as { text: string };
      setState("idle");
      return json.text;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
      setState("idle");
      return null;
    }
  }, [cleanup]);

  const cancel = useCallback(() => {
    recorderRef.current?.stop();
    cleanup();
    setState("idle");
  }, [cleanup]);

  return { state, start, stopAndTranscribe, cancel, error };
}
