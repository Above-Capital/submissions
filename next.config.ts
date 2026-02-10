import type { NextConfig } from "next";

// Arena constraint: static-site deployable
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
