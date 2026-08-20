// @ts-check
import { defineConfig } from "astro/config";
import path from "node:path";

import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
        "@cart": path.resolve("./src/cart"),
        "@product": path.resolve("./src/products"),
        "@shared": path.resolve("./src/shared"),
      },
    },
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
});
