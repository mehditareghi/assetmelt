import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      "heic-to",
      "@jsquash/jpeg",
      "@jsquash/webp",
      "@jsquash/avif",
      "@jsquash/png",
      "@jsquash/oxipng",
      "@jsquash/jxl",
      "@jsquash/qoi",
      "@jsquash/resize",
    ],
  },
  worker: {
    format: "es",
  },
});
