import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" } : {}),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
