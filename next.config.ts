import type { NextConfig } from "next";

// Arena constraint: frontend-only, static export compatible.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
