import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-5">404 · not found</p>
      <h1 className="font-editorial-tight text-6xl md:text-8xl mb-6">
        Nothing <span className="italic-display text-accent">here.</span>
      </h1>
      <p className="text-fg-muted max-w-md mb-10 text-[15px]">
        Either the URL is off or I haven&apos;t shipped this page yet.
      </p>
      <Link
        href="/"
        className="link-underline text-sm text-fg-muted hover:text-accent"
      >
        ← back home
      </Link>
    </div>
  );
}
