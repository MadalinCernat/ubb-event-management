import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    // Exclude E2E tests and Next.js server-only files.
    exclude: ["**/node_modules/**", "**/e2e/**", "**/*.e2e.*"],
  },
});
