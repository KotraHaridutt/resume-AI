import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tells Next.js NOT to bundle pdf-parse, allowing it to run natively
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;