import { getPageByKey, savePage, type SeoPage } from "@/lib/data";
import { resolveLocalPartnersForKeyword } from "@/lib/local-business";
import type { SiteConfig } from "@/lib/site-config-types";
import type { LocalPartner } from "@/lib/data";
import { saveTenantPage } from "@/lib/supabase/tenant-pages";

function getNaverCredentials(config: SiteConfig) {
  return {
    naverClientId:
      config.naverClientId || process.env.NAVER_CLIENT_ID || "",
    naverClientSecret:
      config.naverClientSecret || process.env.NAVER_CLIENT_SECRET || "",
  };
}

export async function ensureLocalPartners(
  page: SeoPage,
  config: SiteConfig,
  siteConfigId?: string | null
): Promise<{ region: string | null; partners: LocalPartner[] }> {
  if (page.localPartners && page.localPartners.length > 0) {
    return {
      region: page.regionName || null,
      partners: page.localPartners,
    };
  }

  const { region, partners } = await resolveLocalPartnersForKeyword(
    page.keyword,
    getNaverCredentials(config)
  );

  if (partners.length > 0) {
    const updated: SeoPage = {
      ...page,
      regionName: region || undefined,
      localPartners: partners,
      updatedAt: new Date().toISOString(),
    };
    if (siteConfigId) {
      await saveTenantPage(siteConfigId, updated);
    } else {
      await savePage(updated);
    }
  }

  return { region, partners };
}

export async function enrichPageWithLocalPartners(
  slug: string,
  config: SiteConfig,
  siteConfigId?: string | null
): Promise<{ region: string | null; partners: LocalPartner[] }> {
  let page: SeoPage | undefined;
  if (siteConfigId) {
    const { getTenantPageByKey } = await import("@/lib/supabase/tenant-pages");
    page = await getTenantPageByKey(siteConfigId, slug);
  } else {
    page = await getPageByKey(slug);
  }
  if (!page) return { region: null, partners: [] };
  return ensureLocalPartners(page, config, siteConfigId);
}
