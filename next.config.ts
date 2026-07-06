import type { NextConfig } from "next";

// When building for GitHub Pages we emit a fully static site under a repo-name
// base path. Locally (dev / preview) both are unset so everything runs at "/".
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "continental-xi";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : "",
  },
};

export default nextConfig;
