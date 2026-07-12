import { unstable_cache } from "next/cache";
import { getPageByKey, getPages } from "@/lib/data";
import { getLegacySiteConfig } from "@/lib/site-config";
import { getTenantPageByKey, getTenantPages } from "@/lib/supabase/tenant-pages";
import { getResolvedSiteConfig } from "@/utils/siteConfig";

export const GUIDE_PAGE_CACHE_TAG = "guide-pages";
export const GUIDE_REVALIDATE_SECONDS = 3600;

/**
 * 테넌트별 / 레거시별 캐시 키를 분리해 Data Cache가 섞이지 않게 함.
 */
export function getCachedGuidePage(slug: string, siteConfigId?: string | null) {
  const scope = siteConfigId || "legacy";
  return unstable_cache(
    async () => {
      if (siteConfigId) {
        const page = await getTenantPageByKey(siteConfigId, slug);
        return { page };
      }
      const page = await getPageByKey(slug);
      return { page };
    },
    [`guide-page-${scope}-${slug}`],
    {
      revalidate: GUIDE_REVALIDATE_SECONDS,
      tags: [GUIDE_PAGE_CACHE_TAG, `guide:${scope}:${slug}`, `guide:${slug}`],
    }
  )();
}

/** hostname 기준으로 테넌트/레거시 페이지 조회 (테넌트 없으면 레거시 폴백) */
export async function resolveCachedGuidePage(slug: string) {
  const { tenant, isTenant } = await getResolvedSiteConfig();
  const siteConfigId = isTenant && tenant ? tenant.id : null;
  const result = await getCachedGuidePage(slug, siteConfigId);
  if (!result.page && siteConfigId) {
    return getCachedGuidePage(slug, null);
  }
  return result;
}

export function getCachedLegacySiteConfig() {
  return unstable_cache(
    async () => getLegacySiteConfig(),
    ["legacy-site-config"],
    { revalidate: GUIDE_REVALIDATE_SECONDS, tags: [GUIDE_PAGE_CACHE_TAG] }
  )();
}

export function getCachedGuideSlugList(siteConfigId?: string | null) {
  const scope = siteConfigId || "legacy";
  return unstable_cache(
    async () => {
      const pages = siteConfigId
        ? await getTenantPages(siteConfigId)
        : await getPages();
      return pages.filter((p) => p.slug?.trim()).map((p) => p.slug);
    },
    [`guide-slug-list-${scope}`],
    { revalidate: GUIDE_REVALIDATE_SECONDS, tags: [GUIDE_PAGE_CACHE_TAG] }
  )();
}
