import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import "highlight.js/styles/github-dark-dimmed.css";
import { Toaster } from "sonner";
import { Grain } from "@/components/ui/grain";
import { Nav } from "@/components/ui/nav";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Ryan Gomez — Founder & CTO, SOYL AI",
  description:
    "Talk to Ryan Gomez. Founder & CTO of SOYL AI. ECE undergrad at MSRIT. Building production multi-agent systems for hospitality. Bengaluru, India.",
  metadataBase: new URL("https://ryangomez.dev"),
  openGraph: {
    title: "Ryan Gomez — Digital Clone",
    description:
      "Real-time RAG-grounded clone. Talk to Ryan via text or voice.",
    siteName: "ryangomez.dev",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ryan Gomez — Digital Clone",
    description: "Real-time RAG-grounded clone.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-fg antialiased">
        <Providers>
          <Grain />
          <Nav />
          <main className="relative z-10">{children}</main>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
