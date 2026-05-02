"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { LenisProvider } from "@/components/ui/lenis-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // Respect reduced motion globally.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      document.documentElement.style.setProperty("--grain-opacity", "0.015");
    }
  }, []);

  return (
    <QueryClientProvider client={client}>
      <LenisProvider>{children}</LenisProvider>
    </QueryClientProvider>
  );
}
