import { defineConfig } from "vitest/config";
import path from "node:path";

process.env.AUTH_SECRET ??= "test-auth-secret-32-characters-min";
process.env.ADMIN_USERNAME ??= "mohnisha";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
