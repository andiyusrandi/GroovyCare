import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  allowedDevOrigins: [
    "172.2.101.25",
    "172.2.101.25:3000",
    "localhost:3000",
    "10.0.2.2:3000"
  ],
};


export default nextConfig;
