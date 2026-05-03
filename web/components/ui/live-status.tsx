"use client";

import { useEffect, useState } from "react";

const STATUS_BY_HOUR: { from: number; to: number; label: string; dot: string }[] = [
  { from: 0,  to: 6,  label: "asleep",          dot: "bg-fg-subtle" },
  { from: 6,  to: 9,  label: "morning routine", dot: "bg-accent" },
  { from: 9,  to: 13, label: "deep work",       dot: "bg-accent" },
  { from: 13, to: 14, label: "lunch",           dot: "bg-accent" },
  { from: 14, to: 19, label: "deep work",       dot: "bg-accent" },
  { from: 19, to: 22, label: "writing / RIT",   dot: "bg-accent" },
  { from: 22, to: 24, label: "winding down",    dot: "bg-fg-muted" },
];

function statusForHour(h: number) {
  return STATUS_BY_HOUR.find((s) => h >= s.from && h < s.to) ?? STATUS_BY_HOUR[0];
}

/**
 * Live IST clock + contextual "what Ryan's probably doing right now" indicator.
 * Updates every minute. Pure client component.
 */
export function LiveStatus({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <span className="eyebrow opacity-40">— ist · syncing</span>
    );
  }

  // IST = UTC+5:30
  const ist = new Date(now.getTime() + (5.5 * 3600 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  const status = statusForHour(hour);
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 eyebrow">
        <span className={`w-1 h-1 rounded-full ${status.dot}`} />
        ist {timeStr} · {status.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 eyebrow">
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${status.dot}`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`} />
      </span>
      bengaluru · {timeStr} ist · ryan is probably {status.label}
    </span>
  );
}
