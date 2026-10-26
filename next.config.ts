import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module; keep it out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  // Backgrounds moved from public/bg-<id>.png to public/backgrounds/<id>.png.
  async redirects() {
    return [{ source: "/bg-:id.png", destination: "/backgrounds/:id.png", permanent: true }];
  },
};

export default nextConfig;
