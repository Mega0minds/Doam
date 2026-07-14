import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing png/jpg as static assets
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
