import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.astro", "src/pages/**", "src/tests/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@cart": path.resolve(rootDir, "./src/cart"),
      "@product": path.resolve(rootDir, "./src/products"),
      "@shared": path.resolve(rootDir, "./src/shared"),
    },
  },
});
