import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

const isVercelBuild = Boolean(process.env.VERCEL);

export default defineConfig({
  // Service worker is generated post-build via scripts/build-pwa.mjs (TanStack Start + Workbox).
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: true,
        // Never let concurrency drop to 0 — the prerender queue deadlocks.
        concurrency: 4,
        // Homepage prerender published a 0-byte index.html in production. Serve `/`
        // via SSR on Vercel while still prerendering /studio (offline pack) and blog.
        filter: isVercelBuild
          ? (page) => page.path !== "/" && page.path !== ""
          : undefined,
      },
    }),
    nitro({
      preset: process.env.VERCEL ? "vercel" : undefined,
    }),
    viteReact(),
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
