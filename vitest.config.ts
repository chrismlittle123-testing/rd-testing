import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 120000, // 2 minutes for org scans
    hookTimeout: 60000,
    globals: true,
  },
});
