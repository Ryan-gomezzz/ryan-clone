"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/cn";

const SUGGESTIONS = [
  "what is SOYL AI?",
  "tell me about the hotel PMS",
  "why pgvector over pinecone?",
  "are you fundraising?",
  "what's your tech stack?",
  "how do I get in touch?",
];

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  showSuggestions?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  showSuggestions,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="w-full">
      {showSuggestions && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              className="text-[12px] font-mono text-fg-muted bg-bg-soft border border-border hover:border-accent-deep hover:text-fg hover:bg-bg-elev rounded-full px-3.5 py-1.5 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative flex items-end gap-2 bg-bg-elev border border-border rounded-lg px-3 py-2.5 transition-all glow-ring"
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="ask about the stack, projects, the long game…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none font-sans text-base leading-relaxed py-1.5"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-md bg-bg border border-border hover:border-danger flex items-center justify-center text-fg-muted hover:text-danger transition-colors"
            aria-label="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className="shrink-0 w-10 h-10 rounded-md bg-accent hover:bg-accent-hot text-bg disabled:opacity-30 disabled:bg-border disabled:text-fg-muted flex items-center justify-center transition-all"
            aria-label="Send"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="mt-2 eyebrow opacity-60">
        enter · send  ·  shift+enter · newline  ·  grounded on Ryan&apos;s public corpus
      </p>
    </div>
  );
}
