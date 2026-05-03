"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  chatOnce,
  fetchVoiceStatus,
  synthesizeAudio,
  transcribeAudio,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { useChatStore } from "@/lib/store";

type CallState =
  | "idle"
  | "recording"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
}

const STATE_LABEL: Record<CallState, string> = {
  idle: "tap to talk",
  recording: "listening · tap to send",
  transcribing: "transcribing",
  thinking: "iris is thinking",
  speaking: "iris is speaking",
  error: "something went wrong",
};

export function VoiceCall() {
  const sessionId = useChatStore((s) => s.sessionId);
  const setSessionId = useChatStore((s) => s.setSessionId);
  const mode = useChatStore((s) => s.mode);

  const [state, setState] = useState<CallState>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: voiceStatus } = useQuery({
    queryKey: ["voice-status"],
    queryFn: fetchVoiceStatus,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
    };
  }, []);

  function pushTurn(role: "user" | "assistant", text: string) {
    setTurns((prev) => [
      ...prev,
      { id: crypto.randomUUID?.() ?? Math.random().toString(36), role, text, ts: Date.now() },
    ]);
  }

  async function startRecording() {
    if (state === "recording") {
      return stopAndProcess();
    }
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      streamRef.current = stream;

      // Pick the best supported mime — Deepgram autodetects.
      const mime =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
          (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
        ) || "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;

      recorder.start();
      setState("recording");
    } catch (err: any) {
      const detail =
        err?.name === "NotAllowedError"
          ? "microphone permission denied — check your browser settings"
          : err?.message || "could not access microphone";
      setErrorMsg(detail);
      setState("error");
      toast.error(detail);
    }
  }

  function stopAndProcess() {
    const r = recorderRef.current;
    if (!r) return;
    if (r.state !== "inactive") r.stop();
  }

  async function handleRecordingStop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || "audio/webm",
    });
    chunksRef.current = [];

    if (blob.size < 1000) {
      setState("idle");
      toast.info("nothing to transcribe — hold the button longer");
      return;
    }

    try {
      // 1. Transcribe
      setState("transcribing");
      const { transcript } = await transcribeAudio(blob);
      if (!transcript.trim()) {
        setState("idle");
        toast.info("didn't catch that — try again");
        return;
      }
      pushTurn("user", transcript);

      // 2. Iris reply (uses persona + RAG + current chat mode)
      setState("thinking");
      const { text: reply, sessionId: newSid } = await chatOnce(
        transcript,
        mode,
        sessionId
      );
      if (newSid && newSid !== sessionId) setSessionId(newSid);
      if (!reply.trim()) {
        setState("error");
        setErrorMsg("iris had nothing to say");
        return;
      }
      pushTurn("assistant", reply);

      // 3. Synthesize and play
      setState("speaking");
      const audioBlob = await synthesizeAudio(reply);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setState("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setState("error");
        setErrorMsg("playback failed");
      };
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setState("error");
      setErrorMsg(err?.message || "voice round-trip failed");
      toast.error(err?.message || "voice round-trip failed");
    }
  }

  function interruptPlayback() {
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
  }

  if (voiceStatus && !voiceStatus.ready) {
    return <NotConfiguredPanel reason={voiceStatus.reason} />;
  }

  const recording = state === "recording";
  const busy = state === "transcribing" || state === "thinking" || state === "speaking";

  return (
    <div className="grid md:grid-cols-[1fr,380px] gap-8">
      <div className="surface p-10 md:p-14 flex flex-col items-center justify-center min-h-[460px]">
        <PulseRing state={state} />

        <p className="mt-10 eyebrow">
          <AnimatePresence mode="wait">
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className={cn(state === "recording" && "eyebrow-accent")}
            >
              {STATE_LABEL[state]}
            </motion.span>
          </AnimatePresence>
        </p>

        <div className="mt-10 flex items-center gap-3">
          {state === "speaking" ? (
            <button
              onClick={interruptPlayback}
              className="inline-flex items-center gap-2 rounded-md border border-border hover:border-danger text-fg-muted hover:text-danger px-5 py-2.5 text-sm transition-all"
            >
              <Square className="w-4 h-4" />
              stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-sans transition-all duration-300",
                recording
                  ? "bg-danger text-bg hover:bg-danger/90"
                  : "bg-accent text-bg hover:bg-accent-hot hover:shadow-[0_8px_32px_-12px_var(--accent)]",
                busy && "opacity-40 pointer-events-none"
              )}
            >
              {recording ? (
                <>
                  <Square className="w-4 h-4" />
                  send
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  {turns.length === 0 ? "start" : "talk again"}
                </>
              )}
            </button>
          )}
        </div>

        {errorMsg && state === "error" && (
          <p className="mt-6 text-danger text-xs font-mono max-w-sm text-center">
            {errorMsg}
          </p>
        )}

        <p className="mt-8 eyebrow opacity-50 text-center max-w-xs">
          press-to-talk · ~2s round-trip · iris uses your active chat mode (
          <span className="text-accent">{mode}</span>)
        </p>
      </div>

      <div className="surface p-6 min-h-[460px] overflow-hidden">
        <p className="eyebrow mb-5">live transcript</p>
        <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
          {turns.length === 0 ? (
            <p className="text-fg-subtle text-sm">
              tap the mic to start. each turn appears here as you speak.
            </p>
          ) : (
            turns.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm leading-relaxed"
              >
                <span
                  className={cn(
                    "eyebrow mr-2",
                    t.role === "user" ? "" : "eyebrow-accent"
                  )}
                >
                  {t.role === "user" ? "you" : "iris"}
                </span>
                <span className="text-fg">{t.text}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PulseRing({ state }: { state: CallState }) {
  const animating =
    state === "recording" || state === "thinking" || state === "speaking";
  const danger = state === "error";

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute inset-0 rounded-full border",
            danger ? "border-danger/40" : "border-accent-deep"
          )}
          animate={
            animating
              ? { scale: [1, 1.7], opacity: [0.55, 0] }
              : { scale: 1, opacity: 0.25 }
          }
          transition={
            animating
              ? {
                  duration: state === "speaking" ? 1.6 : 2.4,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }
              : { duration: 0 }
          }
        />
      ))}
      <div
        className={cn(
          "w-32 h-32 rounded-full bg-bg-elev border flex items-center justify-center transition-all duration-500",
          state === "recording" && "border-accent shadow-[0_0_40px_-8px_var(--accent)]",
          state === "speaking" && "border-accent shadow-[0_0_60px_-8px_var(--accent)]",
          state === "thinking" && "border-fg-muted",
          state === "error" && "border-danger",
          state === "idle" && "border-border"
        )}
      >
        {state === "error" ? (
          <MicOff className="w-8 h-8 text-danger" />
        ) : (
          <Mic
            className={cn(
              "w-8 h-8 transition-colors",
              state === "recording" || state === "speaking"
                ? "text-accent"
                : "text-fg-muted"
            )}
          />
        )}
      </div>
    </div>
  );
}

function NotConfiguredPanel({ reason }: { reason: string | null }) {
  return (
    <div className="surface p-12 md:p-16 text-center max-w-2xl mx-auto">
      <p className="font-editorial text-3xl mb-3">voice is offline.</p>
      <p className="text-fg-muted text-sm max-w-md mx-auto leading-relaxed">
        {reason ??
          "Voice keys aren't configured yet. Set ELEVENLABS_VOICE_ID and VOICE_ENABLED on the api service."}
      </p>
    </div>
  );
}
