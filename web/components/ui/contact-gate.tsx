"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { submitContact } from "@/lib/api";

export function ContactGate() {
  const sessionId = useChatStore((s) => s.sessionId);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || message.trim().length < 3) {
      toast.error("need a real email + a one-liner");
      return;
    }
    setSubmitting(true);
    const res = await submitContact({ email, message, sessionId });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface p-10 text-center"
      >
        <p className="font-editorial text-3xl mb-2">got it.</p>
        <p className="text-fg-muted text-sm">i&apos;ll email back within 24h.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface p-6 md:p-8">
      <p className="eyebrow mb-3">leave a note</p>
      <h3 className="font-editorial text-2xl md:text-3xl mb-1.5">
        Or just <span className="italic-display text-accent">email</span> me.
      </h3>
      <p className="text-fg-muted text-sm mb-6 max-w-lg">
        Email + a one-liner. I&apos;ll loop back within 24h. Prefix the subject
        with <span className="font-mono text-fg">[BIZ]</span> if it&apos;s
        commercial.
      </p>

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@domain.com"
          className="w-full bg-bg-elev border border-border rounded-md px-4 py-3 text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent transition-colors"
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="who you are, what you want to talk about"
          rows={3}
          className="w-full bg-bg-elev border border-border rounded-md px-4 py-3 text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent transition-colors resize-none"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hot text-bg disabled:opacity-40 px-5 py-2.5 rounded-md text-sm font-sans transition-all hover:shadow-[0_8px_32px_-12px_var(--accent)]"
        >
          {submitting ? "sending…" : "send"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
