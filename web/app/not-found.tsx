import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-4">
        404 · not found
      </p>
      <h1 className="font-editorial-tight text-6xl md:text-8xl mb-6">
        nothing <span className="italic-display text-accent">here.</span>
      </h1>
      <p className="text-fg-muted max-w-md mb-8">
        Either the URL is off or I haven&apos;t shipped this page yet.
      </p>
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.25em] text-accent hover:underline"
      >
        ← back home
      </Link>
    </div>
  );
}
