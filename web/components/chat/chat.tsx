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
      className="relative px-6 md:px-10 py-20 md:py-28 max-w-4xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="mb-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-3">
          chat
        </p>
        <h2 className="font-editorial-tight text-4xl md:text-6xl">
          ask <span className="italic-display text-accent">me</span> anything
        </h2>
        <p className="mt-4 max-w-xl text-fg-muted">
          The replies are streamed from a Claude-backed persona, grounded on a
          private knowledge base of my projects, decisions, and writing. If I
          haven&apos;t shipped it, it won&apos;t pretend I have.
        </p>
      </motion.div>

      <div
        ref={scrollRef}
        className="min-h-[300px] max-h-[55vh] overflow-y-auto flex flex-col gap-5 mb-6 pr-1"
      >
        {messages.map((m, i) => (
          <ChatMessageView
            key={m.id}
            message={m}
            isStreaming={isStreaming && i === messages.length - 1 && m.role === "assistant"}
          />
        ))}
      </div>

      <ChatInput
        onSend={send}
        onStop={stop}
        isStreaming={isStreaming}
        showSuggestions={!hasMessages}
      />

      {hasMessages && (
        <button
          onClick={resetConversation}
          className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-fg-muted/60 hover:text-fg transition-colors"
        >
          reset conversation →
        </button>
      )}
    </section>
  );
}
