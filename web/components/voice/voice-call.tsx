"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchVoiceStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type CallState = "idle" | "connecting" | "live" | "ended" | "error";

export function VoiceCall() {
  const [state, setState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>(
    []
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { data: voiceStatus } = useQuery({
    queryKey: ["voice-status"],
    queryFn: fetchVoiceStatus,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      audioCtxRef.current?.close().catch(() => undefined);
    };
  }, []);

  async function startCall() {
    if (!voiceStatus?.ready) return;
    setState("connecting");
    setTranscript([]);

    try {
      const wsBase =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss"
          : "ws";
      const host = window.location.host;
      const ws = new WebSocket(`${wsBase}://${host}/api/voice/ws`);
      wsRef.current = ws;

      ws.onopen = () => setState("live");
      ws.onclose = () => setState("ended");
      ws.onerror = () => setState("error");
      ws.onmessage = (event) => {
        // Pipecat may send JSON events for transcript updates and binary for audio.
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "transcript") {
              setTranscript((t) => [...t, { role: msg.role, text: msg.text }]);
            } else if (msg.type === "latency") {
              setLatencyMs(msg.value);
            }
          } catch {
            /* ignore non-JSON */
          }
        }
        // Binary audio frames are handled by Pipecat's web client when wired in
        // — see VOICE_TODO.md for the production handoff.
      };
    } catch (e) {
      setState("error");
    }
  }

  function endCall() {
    wsRef.current?.close();
    setState("ended");
  }

  if (voiceStatus && !voiceStatus.ready) {
    return <NotConfiguredPanel reason={voiceStatus.reason} />;
  }

  return (
    <div className="grid md:grid-cols-[1fr,360px] gap-8">
      <div className="border border-border bg-bg-elev rounded-md p-8 md:p-12 flex flex-col items-center justify-center min-h-[420px]">
        <PulseRing state={state} />

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">
          {state === "idle" && "ready"}
          {state === "connecting" && "connecting…"}
          {state === "live" && "live · listening"}
          {state === "ended" && "call ended"}
          {state === "error" && "connection failed"}
        </p>

        <div className="mt-10 flex items-center gap-4">
          {state === "live" ? (
            <Button variant="outline" onClick={endCall} className="!border-danger !text-danger">
              <PhoneOff className="w-4 h-4" />
              end call
            </Button>
          ) : (
            <Button onClick={startCall} disabled={state === "connecting"}>
              <Mic className="w-4 h-4" />
              {state === "connecting" ? "connecting…" : "start call"}
            </Button>
          )}
        </div>

        {latencyMs && (
          <p className="mt-6 text-[10px] font-mono uppercase tracking-[0.25em] text-fg-muted">
            round-trip · {latencyMs}ms
          </p>
        )}
      </div>

      <div className="border border-border bg-bg-elev rounded-md p-6 min-h-[420px] overflow-hidden">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-4">
          live transcript
        </p>
        <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
          {transcript.length === 0 ? (
            <p className="text-fg-muted/50 text-sm">
              transcript will stream here once the call is live.
            </p>
          ) : (
            transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm"
              >
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.25em] mr-2",
                    t.role === "user" ? "text-fg-muted" : "text-accent"
                  )}
                >
                  {t.role}
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
  const animating = state === "connecting" || state === "live";
  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-accent-deep"
          animate={
            animating
              ? { scale: [1, 1.6], opacity: [0.6, 0] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={
            animating
              ? {
                  duration: 2.4,
                  repeat: Infinity,
                  delay: i * 0.7,
                  ease: "easeOut",
                }
              : { duration: 0 }
          }
        />
      ))}
      <div
        className={cn(
          "w-32 h-32 rounded-full bg-bg border border-border flex items-center justify-center transition-colors",
          state === "live" && "border-accent"
        )}
      >
        {state === "ended" || state === "error" ? (
          <MicOff className="w-8 h-8 text-fg-muted" />
        ) : (
          <Mic
            className={cn(
              "w-8 h-8",
              state === "live" ? "text-accent" : "text-fg-muted"
            )}
          />
        )}
      </div>
    </div>
  );
}

function NotConfiguredPanel({ reason }: { reason: string | null }) {
  return (
    <div className="border border-border bg-bg-elev rounded-md p-10 text-center">
      <p className="font-editorial text-3xl mb-3">voice is offline.</p>
      <p className="text-fg-muted text-sm max-w-md mx-auto">
        {reason ??
          "Voice keys aren't configured yet. The clone is text-only until ElevenLabs + Deepgram + a cloned voice ID land."}
      </p>
      <p className="mt-6 text-[10px] font-mono uppercase tracking-[0.25em] text-fg-muted/60">
        see VOICE_TODO.md for the recording + setup path
      </p>
    </div>
  );
}
