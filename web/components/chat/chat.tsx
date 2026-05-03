"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ChatInput } from "./chat-input";
import { ChatMessageView } from "./chat-message";
import { ModeToggle } from "./mode-toggle";
import { useChatStore, type ChatMessage, type ChatMode } from "@/lib/store";
import { streamChat, fetchCharacter } from "@/lib/api";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function Chat() {
  const {
    sessionId,
    messages,
    isStreaming,
    mode,
    setSessionId,
    appendMessage,
    appendDelta,
    setMessageMeta,
    setStreaming,
    setError,
    setMode,
    resetConversation,
  } = useChatStore();

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: fetchCharacter,
    staleTime: 60_000,
  });
  const characterName = character?.name ?? "Iris";

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    appendMessage(userMsg);
    appendMessage(assistantMsg);
    setStreaming(true);
    setError(null);

    abortRef.current = new AbortController();
    const trimmedHistory = messages
      .slice(-12)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    let receivedAnyDelta = false;
    let docIds: string[] = [];

    try {
      await streamChat(
        {
          message: text,
          sessionId,
          history: trimmedHistory,
          mode,
          signal: abortRef.current.signal,
        },
        {
          onSession: (id) => setSessionId(id),
          onContext: (ids) => {
            docIds = ids;
          },
          onDelta: (chunk) => {
            receivedAnyDelta = true;
            appendDelta(assistantMsg.id, chunk);
          },
          onDone: (latencyMs) => {
            setMessageMeta(assistantMsg.id, {
              latencyMs,
              retrievedDocs: docIds,
            });
          },
          onError: (detail) => {
            setError(detail);
            toast.error(detail || "the persona layer hit an error");
            if (!receivedAnyDelta) {
              setMessageMeta(assistantMsg.id, {
                content: "(something broke on my end — try again in a sec)",
              });
            }
          },
        }
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error("connection failed");
        setError(e?.message || "unknown");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function onModeChange(m: ChatMode) {
    if (m === mode) return;
    setMode(m);
    resetConversation();
  }

  const hasMessages = messages.length > 0;

  return (
    <section
      id="chat"
      className="relative px-6 md:px-10 py-24 md:py-32 max-w-[1400px] mx-auto"
    >
      <div className="grid md:grid-cols-12 gap-10 md:gap-16">
        {/* Left rail — section title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="md:col-span-4 md:sticky md:top-32 md:self-start"
        >
          <p className="font-script text-3xl text-accent mb-2 leading-none">
            Say hi to —
          </p>
          <h2 className="font-editorial-tight text-4xl md:text-5xl mb-4">
            <span className="italic-display text-accent">{characterName}</span>
          </h2>
          <p className="text-fg-muted text-[15px] leading-relaxed max-w-sm mb-6">
            {mode === "visitor" ? (
              <>
                She&apos;s the part of my thinking that talks. Knows my work
                inside out. Won&apos;t pretend I&apos;ve done things I
                haven&apos;t. Be casual — she is.
              </>
            ) : (
              <>
                Brainstorm mode. Iris pushes back, names assumptions, asks
                the next question instead of restating what you already know.
                Sessions persist, so pick up threads later.
              </>
            )}
          </p>

          <div className="space-y-3 text-sm">
            <Hint label="Stack" body="FastAPI · pgvector · BGE-M3" />
            <Hint label="LLM" body="OpenAI · gpt-4o-mini" />
            <Hint
              label="Voice"
              body={
                character?.voice_enabled
                  ? "ElevenLabs · live"
                  : "voice offline (see /voice)"
              }
            />
          </div>
        </motion.div>

        {/* Right rail — the actual chat surface */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow opacity-70">
              {hasMessages ? `${messages.length / 2 | 0} turns` : "new session"}
            </p>
            <ModeToggle mode={mode} onChange={onModeChange} />
          </div>

          <div className="surface p-4 md:p-6">
            <div
              ref={scrollRef}
              className="min-h-[320px] max-h-[58vh] overflow-y-auto flex flex-col gap-5 mb-5 pr-1"
            >
              {!hasMessages && (
                <EmptyState mode={mode} characterName={characterName} />
              )}
              {messages.map((m, i) => (
                <ChatMessageView
                  key={m.id}
                  message={m}
                  isStreaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                  characterName={characterName}
                />
              ))}
            </div>

            <ChatInput
              onSend={send}
              onStop={stop}
              isStreaming={isStreaming}
              showSuggestions={!hasMessages}
              mode={mode}
            />
          </div>

          {hasMessages && (
            <button
              onClick={resetConversation}
              className="mt-4 eyebrow hover:eyebrow-accent transition-colors"
            >
              ← reset conversation
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Hint({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="eyebrow w-16 shrink-0">{label}</span>
      <span className="text-fg-muted text-[13px] font-mono">{body}</span>
    </div>
  );
}

function EmptyState({
  mode,
  characterName,
}: {
  mode: ChatMode;
  characterName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-center px-6">
      <BreathingMark name={characterName} />
      <p className="font-editorial text-xl text-fg mt-5 mb-1">
        {mode === "visitor"
          ? `I'm ${characterName}.`
          : `Ryan, what are we working on?`}
      </p>
      <p className="text-fg-muted text-sm max-w-xs">
        {mode === "visitor"
          ? "Ask me anything about Ryan — the stack, the projects, the long game."
          : "Pick a thread. I'll push back where I should and stay quiet where you're already right."}
      </p>
    </div>
  );
}

function BreathingMark({ name }: { name: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 rounded-full border border-border flex items-center justify-center bg-bg-elev shadow-[0_0_60px_-12px_var(--accent)]"
    >
      <span className="font-editorial italic text-3xl text-accent">
        {name.charAt(0).toUpperCase()}
      </span>
    </motion.div>
  );
}
