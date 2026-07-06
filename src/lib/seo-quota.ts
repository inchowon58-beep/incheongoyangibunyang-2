import { getSettings, saveSettings, type Settings } from "./data";
import { DEFAULT_SITE_CONFIG } from "./site-config-types";

export interface SeoQuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  today: string;
}

/** VM Worker용 — 한도 초과 시 재시도 시각 안내 */
export interface SeoQuotaWorkerInfo extends SeoQuotaStatus {
  exhausted: boolean;
  canGenerate: boolean;
  /** KST 자정까지 남은 초 (최소 60) */
  retryAfterSec: number;
  /** 다음 생성 가능 시각 (UTC ISO, KST 자정) */
  nextEligibleAt: string;
  /** true면 VM은 generate-next 호출 중단 권장 */
  shouldPause: boolean;
}

function todayKst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** KST 자정까지 남은 초 */
export function getKstSecondsUntilMidnight(): number {
  const now = new Date();
  const kstString = now.toLocaleString("sv-SE", { timeZone: "Asia/Seoul" });
  const timePart = kstString.split(" ")[1] || "00:00:00";
  const [h, mi, s] = timePart.split(":").map((v) => parseInt(v, 10) || 0);
  const elapsed = h * 3600 + mi * 60 + s;
  return Math.max(60, 86400 - elapsed);
}

export function getNextKstMidnightIso(): string {
  const sec = getKstSecondsUntilMidnight();
  return new Date(Date.now() + sec * 1000).toISOString();
}

export async function getSeoQuotaWorkerInfo(
  pendingJobCount = 0
): Promise<SeoQuotaWorkerInfo> {
  const base = await getSeoQuotaStatus();
  const retryAfterSec = getKstSecondsUntilMidnight();
  const exhausted = base.remaining <= 0;
  const canGenerate = !exhausted;

  return {
    ...base,
    exhausted,
    canGenerate,
    retryAfterSec,
    nextEligibleAt: getNextKstMidnightIso(),
    shouldPause: exhausted && pendingJobCount > 0,
  };
}

/** settings.json + 기본값에서 일일 SEO 한도 숫자로 해석 */
export function resolveDailySeoLimit(settings: Settings): number {
  const merged = { ...DEFAULT_SITE_CONFIG, ...settings };
  const parsed = Number.parseInt(String(merged.dailySeoLimit), 10);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return DEFAULT_SITE_CONFIG.dailySeoLimit;
}

export async function getSeoQuotaStatus(): Promise<SeoQuotaStatus> {
  const settings = await getSettings();
  const today = todayKst();
  const limit = resolveDailySeoLimit(settings);
  const used =
    settings.seoQuotaDate === today ? Math.max(0, settings.seoQuotaCount ?? 0) : 0;

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    today,
  };
}

export async function consumeSeoQuota(): Promise<boolean> {
  const status = await getSeoQuotaStatus();
  if (status.remaining <= 0) return false;

  const settings = await getSettings();
  const today = todayKst();
  const used =
    settings.seoQuotaDate === today ? Math.max(0, settings.seoQuotaCount ?? 0) : 0;

  await saveSettings({
    ...settings,
    dailySeoLimit: resolveDailySeoLimit(settings),
    seoQuotaDate: today,
    seoQuotaCount: used + 1,
  });
  return true;
}
