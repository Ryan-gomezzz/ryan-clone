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

  const { data: voiceStatus } = useQuery({
    queryKey: ["voice-status"],
    queryFn: fetchVoiceStatus,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    return () => {
      wsRef.current?.close();
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
    <div className="grid md:grid-cols-[1fr,380px] gap-8">
      <div className="surface p-10 md:p-14 flex flex-col items-center justify-center min-h-[440px]">
        <PulseRing state={state} />

        <p className="mt-10 eyebrow">
          {state === "idle" && "ready"}
          {state === "connecting" && "connecting…"}
          {state === "live" && (
            <span className="eyebrow-accent">live · listening</span>
          )}
          {state === "ended" && "call ended"}
          {state === "error" && "connection failed"}
        </p>

        <div className="mt-10 flex items-center gap-4">
          {state === "live" ? (
            <Button
              variant="outline"
              onClick={endCall}
              className="!border-danger !text-danger hover:!bg-bg-soft"
            >
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
          <p className="mt-6 eyebrow opacity-70">
            round-trip · {latencyMs}ms
          </p>
        )}
      </div>

      <div className="surface p-6 min-h-[440px] overflow-hidden">
        <p className="eyebrow mb-5">live transcript</p>
        <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
          {transcript.length === 0 ? (
            <p className="text-fg-subtle text-sm">
              transcript will stream here once the call is live.
            </p>
          ) : (
            transcript.map((t, i) => (
              <motion.div
                key={i}
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
              ? { scale: [1, 1.7], opacity: [0.55, 0] }
              : { scale: 1, opacity: 0.25 }
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
          "w-32 h-32 rounded-full bg-bg-elev border border-border flex items-center justify-center transition-all duration-500",
          state === "live" && "border-accent shadow-[0_0_40px_-8px_var(--accent)]"
        )}
      >
        {state === "ended" || state === "error" ? (
          <MicOff className="w-8 h-8 text-fg-subtle" />
        ) : (
          <Mic
            className={cn(
              "w-8 h-8 transition-colors",
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
    <div className="surface p-12 md:p-16 text-center max-w-2xl mx-auto">
      <p className="font-editorial text-3xl mb-3">voice is offline.</p>
      <p className="text-fg-muted text-sm max-w-md mx-auto leading-relaxed">
        {reason ??
          "Voice keys aren't configured yet. The clone is text-only until ElevenLabs + Deepgram + a cloned voice ID land."}
      </p>
      <p className="mt-8 eyebrow opacity-60">
        see VOICE_TODO.md for the recording + setup path
      </p>
    </div>
  );
}
