import { DataStorageError, getPages, savePage, type SeoPage } from "./data";
import { buildSeoSlug, ensureUniqueSeoSlug } from "./seo-slug";
import { generateSeoContent } from "./gemini";
import { getImageIndexFromSeed } from "./site-images";
import { consumeSeoQuota, getSeoQuotaStatus, getSeoQuotaStatusForTenant } from "./seo-quota";
import { enqueueCollectionRequest } from "./collection-queue";
import { getServicePeriodStatus } from "./service-period";
import { normalizeSeoKeyword, finalizeSeoTitle } from "./seo-keyword";
import { extractRegionFromKeyword } from "./region-parse";
import { getResolvedSiteConfig, getResolvedSiteConfigForTenant } from "@/utils/siteConfig";
import {
  getTenantPages,
  saveTenantPage,
} from "@/lib/supabase/tenant-pages";
import { guidePageUrl } from "./constants";

export class SeoCreateError extends Error {
  constructor(
    message: string,
    public readonly code: "QUOTA" | "SERVICE" | "DUPLICATE" | "STORAGE" | "GENERATE"
  ) {
    super(message);
    this.name = "SeoCreateError";
  }
}

export async function createSeoPageFromKeyword(
  rawKeyword: string,
  options?: { siteConfigId?: string; skipLocalPartners?: boolean }
): Promise<{
  page: SeoPage;
  collectionEnqueued: boolean;
  tenantId?: string;
}> {
  const service = await getServicePeriodStatus();
  if (!service.active) {
    throw new SeoCreateError(
      "사용 기간이 만료되었습니다. 마스터 설정에서 기간 연장 후 다시 시도하세요.",
      "SERVICE"
    );
  }

  const trimmedKeyword = normalizeSeoKeyword(rawKeyword.trim());

  const resolved = options?.siteConfigId
    ? await getResolvedSiteConfigForTenant(options.siteConfigId)
    : await getResolvedSiteConfig();

  if (options?.siteConfigId && !resolved) {
    throw new SeoCreateError("테넌트 사이트 설정을 찾을 수 없습니다.", "STORAGE");
  }

  const { tenant, isTenant, config: site, tenantUi } = resolved!;

  const quota =
    isTenant && tenant
      ? await getSeoQuotaStatusForTenant(tenant.id)
      : await getSeoQuotaStatus();

  if (quota.remaining <= 0) {
    const label = quota.subdomain ? ` (${quota.subdomain})` : "";
    throw new SeoCreateError(
      `오늘 SEO 페이지 생성 한도${label}(${quota.limit}개)를 모두 사용했습니다.`,
      "QUOTA"
    );
  }

  const existingPages =
    isTenant && tenant ? await getTenantPages(tenant.id) : await getPages();

  const duplicate = existingPages.find(
    (p) => normalizeSeoKeyword(p.keyword) === trimmedKeyword
  );
  if (duplicate) {
    throw new SeoCreateError(
      `이미 등록된 키워드입니다: ${trimmedKeyword}`,
      "DUPLICATE"
    );
  }

  let generated;
  try {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      site.geminiApiKey?.trim() ||
      "";
    generated = await generateSeoContent({
      keyword: trimmedKeyword,
      apiKey,
      site,
      siteBrief:
        isTenant && tenantUi
          ? {
              keywords: tenantUi.keywords,
              aboutText: tenantUi.aboutText || tenantUi.body,
              heroHeadline: tenantUi.heroHeadline,
              siteDesign: tenantUi.siteDesign,
            }
          : undefined,
    });
  } catch (error) {
    if (error instanceof DataStorageError) throw error;
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "AI 콘텐츠 생성에 실패했습니다.";
    throw new SeoCreateError(detail, "GENERATE");
  }

  const now = new Date().toISOString();
  const pageId = isTenant && tenant ? crypto.randomUUID() : `page-${Date.now()}`;
  const baseSlug = buildSeoSlug(trimmedKeyword, pageId, generated.slug);
  const slug = await ensureUniqueSeoSlug(
    baseSlug,
    existingPages.map((p) => p.slug)
  );

  // 관련업체(네이버 플레이스) 수집 제거 — 지역명만 키워드에서 추출
  const region = extractRegionFromKeyword(trimmedKeyword);

  const page: SeoPage = {
    id: pageId,
    slug,
    keyword: trimmedKeyword,
    regionName: region || undefined,
    title: finalizeSeoTitle(generated.title, trimmedKeyword),
    description: generated.description,
    content: generated.content,
    faqs: generated.faqs,
    localPartners: undefined,
    imageIndex: getImageIndexFromSeed(slug, site),
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (isTenant && tenant) {
      await saveTenantPage(tenant.id, page);
    } else {
      await savePage(page);
    }
    await consumeSeoQuota(isTenant && tenant ? tenant.id : undefined);
  } catch (error) {
    if (error instanceof DataStorageError) {
      throw new SeoCreateError(error.message, "STORAGE");
    }
    throw new SeoCreateError(
      error instanceof Error ? error.message : "SEO 페이지 저장 실패",
      "STORAGE"
    );
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidatePath(guidePageUrl(slug));
    revalidatePath("/sitemap.xml");
    revalidatePath("/");
    revalidateTag("guide-pages", "max");
    revalidateTag(`guide:${slug}`, "max");
    if (isTenant && tenant) {
      revalidateTag(`guide:${tenant.id}:${slug}`, "max");
    }
  } catch (error) {
    console.error("revalidate after SEO create failed:", error);
  }

  const enqueueResult = await enqueueCollectionRequest(pageId, page, site.url);
  if (!enqueueResult.ok) {
    console.error("Auto collection enqueue failed:", enqueueResult.message);
  }

  return {
    page,
    collectionEnqueued: enqueueResult.ok,
    tenantId: tenant?.id,
  };
}

/** 기존 키워드 페이지 본문을 AI로 재생성(재포스팅) — slug·keyword 유지 */
export async function regenerateSeoPage(
  pageId: string
): Promise<{
  page: SeoPage;
  collectionEnqueued: boolean;
  tenantId?: string;
}> {
  const service = await getServicePeriodStatus();
  if (!service.active) {
    throw new SeoCreateError(
      "사용 기간이 만료되었습니다. 마스터 설정에서 기간 연장 후 다시 시도하세요.",
      "SERVICE"
    );
  }

  const resolved = await getResolvedSiteConfig();
  const { tenant, isTenant, config: site, tenantUi } = resolved;

  const quota =
    isTenant && tenant
      ? await getSeoQuotaStatusForTenant(tenant.id)
      : await getSeoQuotaStatus();

  if (quota.remaining <= 0) {
    const label = quota.subdomain ? ` (${quota.subdomain})` : "";
    throw new SeoCreateError(
      `오늘 SEO 페이지 생성 한도${label}(${quota.limit}개)를 모두 사용했습니다.`,
      "QUOTA"
    );
  }

  const existingPages =
    isTenant && tenant ? await getTenantPages(tenant.id) : await getPages();
  const existing = existingPages.find((p) => p.id === pageId);
  if (!existing) {
    throw new SeoCreateError("페이지를 찾을 수 없습니다.", "STORAGE");
  }

  const trimmedKeyword = normalizeSeoKeyword(existing.keyword);

  let generated;
  try {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      site.geminiApiKey?.trim() ||
      "";
    generated = await generateSeoContent({
      keyword: trimmedKeyword,
      apiKey,
      site,
      siteBrief:
        isTenant && tenantUi
          ? {
              keywords: tenantUi.keywords,
              aboutText: tenantUi.aboutText || tenantUi.body,
              heroHeadline: tenantUi.heroHeadline,
              siteDesign: tenantUi.siteDesign,
            }
          : undefined,
    });
  } catch (error) {
    if (error instanceof DataStorageError) throw error;
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "AI 콘텐츠 재생성에 실패했습니다.";
    throw new SeoCreateError(detail, "GENERATE");
  }

  const now = new Date().toISOString();
  const region = extractRegionFromKeyword(trimmedKeyword);
  const page: SeoPage = {
    ...existing,
    regionName: region || existing.regionName,
    title: finalizeSeoTitle(generated.title, trimmedKeyword),
    description: generated.description,
    content: generated.content,
    faqs: generated.faqs,
    imageIndex: existing.imageIndex ?? getImageIndexFromSeed(existing.slug, site),
    updatedAt: now,
  };

  try {
    if (isTenant && tenant) {
      await saveTenantPage(tenant.id, page);
    } else {
      await savePage(page);
    }
    await consumeSeoQuota(isTenant && tenant ? tenant.id : undefined);
  } catch (error) {
    if (error instanceof DataStorageError) {
      throw new SeoCreateError(error.message, "STORAGE");
    }
    throw new SeoCreateError(
      error instanceof Error ? error.message : "SEO 페이지 저장 실패",
      "STORAGE"
    );
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidatePath(guidePageUrl(page.slug));
    revalidatePath("/sitemap.xml");
    revalidatePath("/");
    revalidateTag("guide-pages", "max");
    revalidateTag(`guide:${page.slug}`, "max");
    if (isTenant && tenant) {
      revalidateTag(`guide:${tenant.id}:${page.slug}`, "max");
    }
  } catch (error) {
    console.error("revalidate after SEO regenerate failed:", error);
  }

  const enqueueResult = await enqueueCollectionRequest(page.id, page, site.url);
  if (!enqueueResult.ok) {
    console.error("Auto collection enqueue after regenerate failed:", enqueueResult.message);
  }

  return {
    page,
    collectionEnqueued: enqueueResult.ok,
    tenantId: tenant?.id,
  };
}
