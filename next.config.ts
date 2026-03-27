import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
