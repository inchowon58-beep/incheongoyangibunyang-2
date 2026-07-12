import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/guide/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/seo/:slug",
        destination: "/guide/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/feed.xml", destination: "/feed" },
      { source: "/rss.xml", destination: "/feed" },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.cattery.co.kr",
        pathname: "/jejuland/**",
      },
      {
        protocol: "https",
        hostname: "image.cattery.co.kr",
        pathname: "/dogboho/**",
      },
      {
        protocol: "https",
        hostname: "image.cattery.co.kr",
        pathname: "/chul/**",
      },
      {
        protocol: "https",
        hostname: "image.cattery.co.kr",
        pathname: "/coton/**",
      },
      {
        protocol: "https",
        hostname: "demolishzone.yourdogzone.co.kr",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.yourdogzone.co.kr",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
