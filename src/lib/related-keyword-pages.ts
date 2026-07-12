import type { SeoPage } from "@/lib/data";
import { guidePageUrl } from "@/lib/constants";
import { resolvePagesContext } from "@/lib/pages-resolver";
import { getImageIndexFromSeed, getImageUrl } from "@/lib/site-images";
import type { SiteConfig } from "@/lib/site-config-types";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let hash = hashSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RelatedKeywordPageLink {
  keyword: string;
  href: string;
  slug: string;
  imageUrl?: string;
}

/**
 * 발행된 SEO 페이지 중 현재 페이지를 제외하고 시드 기반 랜덤 최대 limit개.
 */
export async function getRelatedKeywordPageLinks(
  currentSlug: string,
  currentKeyword: string,
  limit = 30,
  config?: SiteConfig
): Promise<RelatedKeywordPageLink[]> {
  const { pages } = await resolvePagesContext();
  const candidates = pages.filter((p) => p.slug !== currentSlug);
  if (candidates.length === 0) return [];

  const shuffled = seededShuffle(
    candidates,
    `${currentSlug}:${currentKeyword}:related-random`
  );

  return shuffled.slice(0, limit).map((page: SeoPage) => {
    const imageIndex =
      page.imageIndex ||
      (config
        ? getImageIndexFromSeed(page.slug || page.keyword, config)
        : 1);
    return {
      keyword: page.keyword,
      href: guidePageUrl(page.slug),
      slug: page.slug,
      imageUrl: config ? getImageUrl(imageIndex, config) : undefined,
    };
  });
}
