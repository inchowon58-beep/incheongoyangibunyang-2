import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import seoManifest from "@/lib/seo-pages.json";

type SeoPage = {
  url: string;
  lastmod?: string;
  images?: string[];
};

const manifest = seoManifest as { pages?: SeoPage[] };

function absImage(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const root = siteUrl.replace(/\/$/, "");
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const push = (
    url: string,
    priority: number,
    images?: string[],
    lastmod?: string,
  ) => {
    const loc = url.replace(/\/$/, "") || root;
    if (seen.has(loc)) return;
    seen.add(loc);
    entries.push({
      url: loc,
      lastModified: lastmod ? new Date(lastmod) : new Date(),
      changeFrequency: "weekly",
      priority,
      ...(images?.length ? { images: images.map(absImage) } : {}),
    });
  };

  push(siteUrl, 1);
  for (const page of manifest.pages ?? []) {
    if (!page.url) continue;
    const norm = page.url.replace(/\/$/, "");
    push(page.url, norm === root ? 1 : 0.8, page.images, page.lastmod);
  }
  return entries;
}
