import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build in .next/standalone that the VM runs with `node server.js` (#22).
  output: "standalone",
  // Native module; keep it out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      // Backgrounds moved from public/bg-<id>.png to public/backgrounds/<id>.png.
      { source: "/bg-:id.png", destination: "/backgrounds/:id.png", permanent: true },
      // Calendar and Mii became one Progress page; ?month= carries over.
      { source: "/calendar", destination: "/progress", permanent: false },
      { source: "/mii/:path*", destination: "/progress", permanent: false },
    ];
  },
  // The pop-out widget frames /widget (#66); nobody else may.
  async headers() {
    return [
      {
        source: "/widget",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
    ];
  },
};

export default nextConfig;
