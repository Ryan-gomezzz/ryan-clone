"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  retrievedDocs?: string[];
  latencyMs?: number;
}

export type ChatMode = "visitor" | "brainstorm";

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  mode: ChatMode;

  setSessionId: (id: string) => void;
  appendMessage: (msg: ChatMessage) => void;
  appendDelta: (id: string, delta: string) => void;
  setMessageMeta: (id: string, meta: Partial<ChatMessage>) => void;
  setStreaming: (b: boolean) => void;
  setError: (e: string | null) => void;
  setMode: (mode: ChatMode) => void;
  resetConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: null,
      messages: [],
      isStreaming: false,
      error: null,
      mode: "visitor",

      setSessionId: (id) => set({ sessionId: id }),
      setMode: (mode) => set({ mode }),

      appendMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      appendDelta: (id, delta) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + delta } : m
          ),
        })),

      setMessageMeta: (id, meta) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...meta } : m)),
        })),

      setStreaming: (b) => set({ isStreaming: b }),
      setError: (e) => set({ error: e }),

      resetConversation: () => set({ messages: [], sessionId: null, error: null }),
    }),
    {
      name: "ryan-clone-chat",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sessionId: s.sessionId,
        messages: s.messages,
        mode: s.mode,
      }),
    }
  )
);
