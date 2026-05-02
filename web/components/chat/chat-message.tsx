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
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[88%] md:max-w-[78%] px-5 py-3.5 rounded-md",
          isUser
            ? "bg-bg-elev border border-border text-fg"
            : "text-fg"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-fg-muted">
            <span className="w-1 h-1 rounded-full bg-accent" />
            ryan
            {message.latencyMs ? (
              <span className="opacity-50">· {message.latencyMs}ms</span>
            ) : null}
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
                <ThinkingShimmer />
              )}
              {isStreaming && message.content.length > 0 && (
                <span className="inline-block w-2 h-4 ml-0.5 -mb-0.5 bg-accent animate-subtle-pulse" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ThinkingShimmer() {
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="h-3 w-44 rounded shimmer" />
      <div className="h-3 w-72 rounded shimmer" />
      <div className="h-3 w-56 rounded shimmer" />
    </div>
  );
}
