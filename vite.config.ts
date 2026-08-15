import path from "path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
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

/** Mirror `src/lib/studio-seo` curated paths so dynamic routes get static HTML. */
function studioConversionPrerenderPages(): Array<{ path: string }> {
  const pairsSource = readFileSync(
    path.resolve(__dirname, "src/lib/studio-seo/pairs.ts"),
    "utf8",
  );
  const inputSlug: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    avif: "avif",
    gif: "gif",
    bmp: "bmp",
    svg: "svg",
    heic: "heic",
    jxl: "jxl",
    qoi: "qoi",
    tiff: "tiff",
  };
  const outputSlug: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    avif: "avif",
    jxl: "jxl",
    qoi: "qoi",
  };

  const paths = new Set<string>();
  for (const match of pairsSource.matchAll(
    /\{\s*from:\s*'([a-z]+)',\s*to:\s*'([a-z]+)'/g,
  )) {
    const from = inputSlug[match[1]] ?? match[1];
    const to = outputSlug[match[2]] ?? match[2];
    paths.add(`/studio/${from}-to-${to}`);
  }

  const targetsBlock = pairsSource.match(
    /INDEXABLE_OUTPUT_TARGETS[^=]*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (targetsBlock) {
    for (const match of targetsBlock[1].matchAll(/'([a-z]+)'/g)) {
      const to = outputSlug[match[1]] ?? match[1];
      paths.add(`/studio/to-${to}`);
    }
  }

  return [...paths].map((pagePath) => ({ path: pagePath }));
}

const sentryRelease = resolveSentryReleaseName();

export default defineConfig({
  // Service worker is generated post-build via scripts/build-pwa.mjs (TanStack Start + Workbox).
  plugins: [
    tanstackStart({
      pages: studioConversionPrerenderPages(),
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
      // Package exports hide the Emscripten glue; Vite needs a static WASM URL.
      "@squoosh-kit/imagequant-wasm": path.resolve(
        __dirname,
        "node_modules/@squoosh-kit/imagequant/dist/wasm/imagequant/imagequant.js",
      ),
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
      "@squoosh-kit/imagequant",
      "@squoosh-kit/imagequant-wasm",
    ],
  },
  worker: {
    format: "es",
  },
});
