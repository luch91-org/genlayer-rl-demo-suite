/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-first: the core experience is a static site that reads manifests.
  // Live on-chain reads happen client-side at runtime; no backend required.
  output: "export",
  images: { unoptimized: true },
  // Allow deploying under a repo subpath on GitHub Pages when needed.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
};

export default nextConfig;
