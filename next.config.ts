import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingExcludes: {
    "/*": ["./public/images/**/*", "./node_modules/**/*"],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
