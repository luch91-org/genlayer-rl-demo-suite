import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-first: the core experience is a static site that reads manifests.
  // Live on-chain reads happen client-side at runtime; no backend required.
  output: "export",
  images: { unoptimized: true },
  // Allow deploying under a repo subpath on GitHub Pages when needed.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
  // Pin the workspace root so a stray parent lockfile does not confuse tracing.
  outputFileTracingRoot: here,
};

export default nextConfig;
