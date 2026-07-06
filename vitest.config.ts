import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components use the React automatic JSX runtime; tests import them for
  // identity checks, so esbuild must transform JSX without a React import.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
  },
});
