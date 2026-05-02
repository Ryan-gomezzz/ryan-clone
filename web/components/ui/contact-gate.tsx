"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useChatStore } from "@/lib/store";
import { submitContact } from "@/lib/api";
import { Button } from "./button";

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-border bg-bg-elev rounded-md p-6 text-center"
      >
        <p className="font-editorial text-2xl mb-1">got it.</p>
        <p className="text-fg-muted text-sm">i&apos;ll email back within 24h.</p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-border bg-bg-elev rounded-md p-6 md:p-8"
    >
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-3">
        get in touch
      </p>
      <h3 className="font-editorial text-2xl md:text-3xl mb-1">
        leave a note.
      </h3>
      <p className="text-fg-muted text-sm mb-6">
        Email + a one-liner on what you&apos;re working on. I&apos;ll loop back
        within 24h. For business, prefix the subject with{" "}
        <span className="font-mono text-fg">[BIZ]</span>.
      </p>

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@domain.com"
          className="w-full bg-bg border border-border rounded px-4 py-3 text-fg placeholder:text-fg-muted/50 focus:outline-none focus:border-accent-deep transition-colors"
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="who you are, what you want to talk about"
          rows={3}
          className="w-full bg-bg border border-border rounded px-4 py-3 text-fg placeholder:text-fg-muted/50 focus:outline-none focus:border-accent-deep transition-colors resize-none"
          required
        />
        <Button type="submit" disabled={submitting} className="w-full md:w-auto">
          {submitting ? "sending…" : "send"}
        </Button>
      </div>
    </form>
  );
}
