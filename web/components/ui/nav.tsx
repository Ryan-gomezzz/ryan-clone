"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Index", num: "01" },
  { href: "/projects", label: "Work", num: "02" },
  { href: "/voice", label: "Voice", num: "03" },
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-bg/70 backdrop-blur-xl border-b border-border"
          : "py-5 bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
        >
          <span className="font-editorial text-base text-fg group-hover:text-accent transition-colors">
            Ryan Gomez
          </span>
          <span className="num-tag opacity-60 group-hover:opacity-100 transition-opacity">
            ⌁ ai clone
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          {links.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group relative flex items-baseline gap-1.5 text-sm font-sans transition-colors py-1",
                  active ? "text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                <span className={cn(
                  "num-tag transition-opacity",
                  active ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                )}>
                  {l.num}
                </span>
                <span>{l.label}</span>
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 right-0 h-px bg-accent origin-left transition-transform duration-500",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            );
          })}

          <a
            href="https://github.com/Ryan-gomezzz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline text-sm text-fg-muted hover:text-accent transition-colors"
          >
            ↗ github
          </a>
        </nav>
      </div>
    </header>
  );
}
