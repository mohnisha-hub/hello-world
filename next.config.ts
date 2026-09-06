import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "prisma"],
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
};

export default nextConfig;
