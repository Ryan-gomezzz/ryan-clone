"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/voice", label: "Voice" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-5">
      <Link
        href="/"
        className="font-editorial text-lg tracking-tight hover:text-accent transition-colors"
      >
        ryan<span className="italic-display text-accent">.</span>gomez
      </Link>
      <nav className="flex items-center gap-7 text-sm font-sans text-fg-muted">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative transition-colors hover:text-fg",
                active && "text-fg"
              )}
            >
              {l.label}
              {active && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-accent" />
              )}
            </Link>
          );
        })}
        <a
          href="https://github.com/Ryan-gomezzz"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline transition-colors hover:text-fg"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
