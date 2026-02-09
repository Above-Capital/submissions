import type { NextConfig } from "next";

// Arena constraint: must be deployable as a static site.
// We enable static export so `next build` produces an /out directory.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
