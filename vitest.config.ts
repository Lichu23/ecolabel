import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Vitest runs outside Next.js server context — stub the package so tests
      // that import server-only modules (like rag.ts) still run correctly.
      "server-only": new URL("./src/__mocks__/server-only.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/supabase/**"],
    },
  },
});
