import { getSettings } from "@/lib/data";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-types";
import { fetchTenantById, getSupabaseAdmin } from "./tenant-db";
import type { TenantSiteConfigRow } from "@/types/tenant";

export function todayKst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function globalDailyLimitFromSettings(settings: Awaited<ReturnType<typeof getSettings>>): number {
  const parsed = Number.parseInt(String(settings.dailySeoLimit ?? DEFAULT_SITE_CONFIG.dailySeoLimit), 10);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return DEFAULT_SITE_CONFIG.dailySeoLimit;
}

export function resolveTenantDailySeoLimit(
  tenant: Pick<TenantSiteConfigRow, "daily_seo_limit">,
  globalLimit: number
): number {
  if (tenant.daily_seo_limit != null && tenant.daily_seo_limit >= 0) {
    return tenant.daily_seo_limit;
  }
  return globalLimit;
}

export async function getTenantSeoQuotaStatus(siteConfigId: string): Promise<{
  limit: number;
  used: number;
  remaining: number;
  today: string;
  subdomain: string;
}> {
  const tenant = await fetchTenantById(siteConfigId);
  if (!tenant) {
    throw new Error("테넌트 사이트를 찾을 수 없습니다.");
  }

  const settings = await getSettings();
  const globalLimit = globalDailyLimitFromSettings(settings);
  const today = todayKst();
  const limit = resolveTenantDailySeoLimit(tenant, globalLimit);
  const used =
    tenant.seo_quota_date === today ? Math.max(0, tenant.seo_quota_count ?? 0) : 0;

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    today,
    subdomain: tenant.subdomain,
  };
}

export async function consumeTenantSeoQuota(siteConfigId: string): Promise<boolean> {
  const tenant = await fetchTenantById(siteConfigId);
  if (!tenant) return false;

  const settings = await getSettings();
  const globalLimit = globalDailyLimitFromSettings(settings);
  const today = todayKst();
  const limit = resolveTenantDailySeoLimit(tenant, globalLimit);
  const used =
    tenant.seo_quota_date === today ? Math.max(0, tenant.seo_quota_count ?? 0) : 0;

  if (used >= limit) return false;

  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from("site_configs")
    .update({
      seo_quota_date: today,
      seo_quota_count: used + 1,
    })
    .eq("id", siteConfigId);

  return !error;
}

export async function updateTenantDailySeoLimit(
  siteConfigId: string,
  dailySeoLimit: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { error } = await supabase
    .from("site_configs")
    .update({ daily_seo_limit: Math.max(0, dailySeoLimit) })
    .eq("id", siteConfigId);

  if (error) throw new Error(error.message);
}

/** 마스터 「하루 생성 가능 수량」 변경 시 등록된 모든 테넌트 한도 동기화 */
export async function syncAllTenantsDailySeoLimit(
  dailySeoLimit: number
): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  const limit = Math.max(0, dailySeoLimit);
  const { data: rows, error: listError } = await supabase
    .from("site_configs")
    .select("id");

  if (listError) throw new Error(`테넌트 목록 조회 실패: ${listError.message}`);
  if (!rows?.length) return 0;

  const ids = rows.map((r) => r.id as string);
  const { error } = await supabase
    .from("site_configs")
    .update({ daily_seo_limit: limit })
    .in("id", ids);

  if (error) throw new Error(`테넌트 한도 동기화 실패: ${error.message}`);
  return ids.length;
}
