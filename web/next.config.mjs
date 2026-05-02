/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/drei",
    ],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      // Proxy SSE chat through Next so we can stay same-origin in dev.
      { source: "/api/chat/:path*", destination: `${apiBase}/chat/:path*` },
      { source: "/api/projects/:path*", destination: `${apiBase}/projects/:path*` },
      { source: "/api/voice/:path*", destination: `${apiBase}/voice/:path*` },
      { source: "/api/healthz", destination: `${apiBase}/healthz` },
    ];
  },
};

export default nextConfig;
