"use client";

export interface ChatStreamHandlers {
  onSession?: (sessionId: string) => void;
  onContext?: (docIds: string[], docTitles: string[]) => void;
  onDelta?: (text: string) => void;
  onDone?: (latencyMs: number) => void;
  onError?: (detail: string) => void;
}

/**
 * POST /api/chat with SSE streaming. Parses event-stream by hand to avoid
 * the EventSource limitations (no body, no headers).
 */
export async function streamChat(
  args: {
    message: string;
    sessionId: string | null;
    history: { role: string; content: string }[];
    signal?: AbortSignal;
  },
  handlers: ChatStreamHandlers
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: args.message,
      session_id: args.sessionId,
      history: args.history,
    }),
    signal: args.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    handlers.onError?.(detail || `HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      let event: string | null = null;
      let dataLine = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(dataLine);
      } catch {
        continue;
      }

      switch (event) {
        case "session":
          handlers.onSession?.(parsed.session_id);
          break;
        case "context":
          handlers.onContext?.(parsed.doc_ids ?? [], parsed.doc_titles ?? []);
          break;
        case "delta":
          handlers.onDelta?.(parsed.text ?? "");
          break;
        case "done":
          handlers.onDone?.(parsed.latency_ms ?? 0);
          break;
        case "error":
          handlers.onError?.(parsed.detail ?? "unknown error");
          break;
      }
    }
  }
}

export interface ProjectMeta {
  slug: string;
  title: string;
  type: string;
  status: string;
  priority: number;
  summary: string;
}

export async function fetchProjects(): Promise<ProjectMeta[]> {
  const res = await fetch("/api/projects", { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.projects ?? [];
}

export interface ProjectDetail extends ProjectMeta {
  content: string;
}

export async function fetchProject(slug: string): Promise<ProjectDetail | null> {
  const res = await fetch(`/api/projects/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.error) return null;
  return json;
}

export async function submitContact(args: {
  email: string;
  message: string;
  sessionId: string | null;
}): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/chat/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: args.email,
      message: args.message,
      session_id: args.sessionId,
    }),
  });
  if (!res.ok) {
    return { ok: false, message: "didn't go through — try again later" };
  }
  return res.json();
}

export async function fetchVoiceStatus(): Promise<{
  ready: boolean;
  reason: string | null;
}> {
  try {
    const res = await fetch("/api/voice/status");
    if (!res.ok) return { ready: false, reason: "voice service unavailable" };
    return res.json();
  } catch {
    return { ready: false, reason: "voice service unreachable" };
  }
}
