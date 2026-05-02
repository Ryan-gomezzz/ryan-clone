"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChatInput } from "./chat-input";
import { ChatMessageView } from "./chat-message";
import { useChatStore, type ChatMessage } from "@/lib/store";
import { streamChat } from "@/lib/api";

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
    setSessionId,
    appendMessage,
    appendDelta,
    setMessageMeta,
    setStreaming,
    setError,
    resetConversation,
  } = useChatStore();

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
          <p className="eyebrow mb-4">
            <span className="num-tag mr-2">/01</span>
            chat
          </p>
          <h2 className="font-editorial-tight text-4xl md:text-5xl mb-6">
            Ask me <span className="italic-display text-accent">anything.</span>
          </h2>
          <p className="text-fg-muted text-[15px] leading-relaxed max-w-sm">
            Streamed from a Claude/GPT persona, grounded on a private corpus
            of my projects, decisions, and writing. If I haven&apos;t shipped
            it, the clone won&apos;t pretend I have.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <Hint label="Stack" body="FastAPI · pgvector · BGE-M3 · Redis" />
            <Hint label="Latency" body="~600ms first token" />
            <Hint label="Persona" body="No LinkedIn-influencer prose" />
          </div>
        </motion.div>

        {/* Right rail — the actual chat surface */}
        <div className="md:col-span-8">
          <div className="surface p-4 md:p-6">
            <div
              ref={scrollRef}
              className="min-h-[320px] max-h-[58vh] overflow-y-auto flex flex-col gap-5 mb-5 pr-1"
            >
              {!hasMessages && <EmptyState />}
              {messages.map((m, i) => (
                <ChatMessageView
                  key={m.id}
                  message={m}
                  isStreaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              ))}
            </div>

            <ChatInput
              onSend={send}
              onStop={stop}
              isStreaming={isStreaming}
              showSuggestions={!hasMessages}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-center px-6">
      <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-4">
        <span className="font-editorial italic text-2xl text-accent">R</span>
      </div>
      <p className="font-editorial text-xl text-fg mb-1">
        the line is open.
      </p>
      <p className="text-fg-muted text-sm max-w-xs">
        Pick a thread below or type your own question to get started.
      </p>
    </div>
  );
}
