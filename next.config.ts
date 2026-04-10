import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // @ts-ignore - suggested by Next.js dev server for cross-origin local network access
  allowedDevOrigins: ["141.219.225.236"],
};

export default nextConfig;
