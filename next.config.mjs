/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin must run in the Node.js runtime, never bundled for the edge.
  serverExternalPackages: ["firebase-admin"],
  // Tree-shake big icon/util barrels so dashboard bundles stay small (less JS to
  // parse/hydrate → lower TBT and faster interaction after LCP).
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Long-cache immutable static assets (fonts, JS chunks) for repeat visits.
  poweredByHeader: false,
  eslint: {
    // Lint is run explicitly via `npm run lint`; don't fail production builds on it.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
