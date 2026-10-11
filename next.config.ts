import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" } : {}),
  basePath: process.env.BASE_PATH || "",
  env: {
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:8080/viking-expenses/api/v1",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    BASE_PATH: process.env.BASE_PATH || "",
  },
};

export default nextConfig;
