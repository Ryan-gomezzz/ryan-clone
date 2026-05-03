"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/store";

export function ChatMessageView({
  message,
  isStreaming,
  characterName = "Iris",
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  characterName?: string;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[92%] md:max-w-[88%] px-4 py-3 rounded-lg",
          isUser
            ? "bg-bg-soft border border-border text-fg"
            : "text-fg"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 eyebrow flex-wrap">
            <span className="w-1 h-1 rounded-full bg-accent" />
            <span>{characterName.toLowerCase()}</span>
            {message.latencyMs ? (
              <span className="opacity-50">· {message.latencyMs}ms</span>
            ) : null}
            {message.retrievedDocs && message.retrievedDocs.length > 0 && (
              <>
                <span className="opacity-30">·</span>
                <span className="opacity-50">grounded on</span>
                {message.retrievedDocs.slice(0, 3).map((d) => (
                  <span
                    key={d}
                    className="px-1.5 py-0.5 rounded border border-border text-fg-muted lowercase opacity-70 hover:opacity-100 hover:border-accent-deep transition-all"
                  >
                    {d.replace("projects/", "")}
                  </span>
                ))}
              </>
            )}
          </div>
        )}
        <div className="message-prose">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content || ""}
              </ReactMarkdown>
              {isStreaming && message.content.length === 0 && (
                <ThinkingState />
              )}
              {isStreaming && message.content.length > 0 && (
                <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-accent animate-pulse" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ThinkingState() {
  // Cycle through realistic descriptions of what's happening server-side.
  const stages = [
    "embedding query",
    "searching corpus",
    "ranking chunks",
    "drafting reply",
  ];
  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="flex items-center gap-2">
        <ThinkingDots />
        <ThinkingLabel stages={stages} />
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-44 rounded shimmer" />
        <div className="h-2 w-72 rounded shimmer" />
        <div className="h-2 w-56 rounded shimmer" />
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-accent"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ThinkingLabel({ stages }: { stages: string[] }) {
  return (
    <div className="relative h-3 overflow-hidden">
      <motion.div
        className="absolute inset-0 flex flex-col"
        animate={{ y: stages.map((_, i) => -i * 12) }}
        transition={{
          duration: stages.length * 0.7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {stages.map((s) => (
          <span
            key={s}
            className="eyebrow opacity-70 h-3 leading-3 whitespace-nowrap"
          >
            {s}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
