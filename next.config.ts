import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp and pdf-lib use native Node.js modules that must not be bundled
  // by webpack — they are resolved at runtime in the serverless environment.
  serverExternalPackages: ["sharp", "pdf-lib", "@resvg/resvg-js"],
};

export default nextConfig;
