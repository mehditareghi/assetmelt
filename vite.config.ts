import path from "path";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

const isVercelBuild = Boolean(process.env.VERCEL);

function resolveSentryReleaseName(): string | undefined {
  const version =
    process.env.APP_VERSION ??
    (() => {
      try {
        return execSync("git describe --tags --abbrev=0", {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        })
          .trim()
          .replace(/^v/, "");
      } catch {
        return null;
      }
    })();

  return version && version !== "dev" ? version : undefined;
}

const sentryRelease = resolveSentryReleaseName();

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
    sentryTanstackStart({
      org: "assetmelt",
      project: "assetmelt-web",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      tunnelRoute: true,
      ...(sentryRelease
        ? {
            release: {
              name: sentryRelease,
              setCommits: { auto: true, ignoreMissing: true },
            },
          }
        : {}),
    }),
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
