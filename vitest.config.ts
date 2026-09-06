import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    // Use top-level await in test files (for dynamic imports of mocked modules).
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist", ".output"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/trace/**/*.ts"],
      exclude: ["**/__tests__/**"],
    },
  },
});
