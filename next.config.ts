import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid Next.js selecting a parent directory due to other lockfiles.
    root: __dirname,
  },
};

export default nextConfig;
