import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
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
