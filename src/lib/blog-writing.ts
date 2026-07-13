import {
  getBlogWritingStore,
  saveBlogWritingStore,
  type BlogWritingJob,
  type BlogWritingSiteRecord,
  type BlogWritingStore,
} from "./data";
import { parseKeywordList } from "./parse-keywords";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import { fetchNaverAccountById } from "@/lib/supabase/naver-accounts";

export type BlogWritingStyle = "info" | "review";
export type BlogPublishMode = "random" | "continuous";

export interface BlogWritingPublicConfig {
  siteKey: string;
  siteUrl: string;
  brandName: string;
  phone: string;
  naverId: string;
  hasPassword: boolean;
  basePrompt: string;
  writingStyle: BlogWritingStyle;
  dailyCount: number;
  publishMode: BlogPublishMode;
  /** 발행 시간대 시작 (0~23, KST) */
  windowStartHour: number;
  /** 발행 시간대 종료 (0~23, KST) */
  windowEndHour: number;
  enabled: boolean;
  keywordsText: string;
  keywordQueueCount: number;
  publishedToday: number;
  publishedDate: string;
  dailyRemaining: number;
  linkedNaverIdFromSite: string | null;
  updatedAt: string;
}

function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function clampHour(h: number, fallback: number): number {
  if (!Number.isFinite(h)) return fallback;
  return Math.max(0, Math.min(23, Math.floor(h)));
}

function resolveWindowHours(site: {
  windowStartHour?: number;
  windowEndHour?: number;
}): { start: number; end: number } {
  return {
    start: clampHour(site.windowStartHour ?? 9, 9),
    end: clampHour(site.windowEndHour ?? 21, 21),
  };
}

function atKst(dateStr: string, hour: number, minute: number): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");
  return new Date(`${dateStr}T${hh}:${mm}:00+09:00`);
}

function addDaysKst(dateStr: string, days: number): string {
  const base = new Date(`${dateStr}T12:00:00+09:00`);
  base.setTime(base.getTime() + days * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

/**
 * 발행 시간대 안에서 scheduledAt(ISO) 생성.
 * start=1, end=5 → 오늘 01:00~05:00 KST
 * start=22, end=2 → 오늘 22:00~다음날 02:00
 */
function scheduleInPublishWindow(
  mode: BlogPublishMode,
  startHour: number,
  endHour: number,
  index: number,
  total: number
): string {
  const start = clampHour(startHour, 9);
  const end = clampHour(endHour, 21);
  const today = todayKst();
  const overnight = end < start;

  const windowStart = atKst(today, start, 0);
  const windowEnd = overnight
    ? atKst(addDaysKst(today, 1), end, 0)
    : end === start
      ? atKst(today, start, 59)
      : atKst(today, end, 0);

  let spanMs = windowEnd.getTime() - windowStart.getTime();
  if (spanMs <= 0) spanMs = 60 * 60 * 1000;

  const now = Date.now();
  let pickMs: number;

  if (mode === "continuous") {
    const n = Math.max(1, total);
    const slot = spanMs / n;
    pickMs = windowStart.getTime() + slot * index + Math.min(2 * 60 * 1000, slot * 0.2);
  } else {
    pickMs = windowStart.getTime() + Math.floor(Math.random() * spanMs);
  }

  if (pickMs < now) {
    const remain = windowEnd.getTime() - now;
    if (remain > 2 * 60 * 1000) {
      pickMs =
        mode === "continuous"
          ? now + Math.floor(((remain - 60 * 1000) * (index + 1)) / Math.max(1, total))
          : now + 60 * 1000 + Math.floor(Math.random() * (remain - 60 * 1000));
    } else if (windowEnd.getTime() > now) {
      pickMs = now + 30 * 1000;
    } else {
      const tomorrow = addDaysKst(today, 1);
      const nextStart = atKst(tomorrow, start, 0);
      const nextEnd = overnight
        ? atKst(addDaysKst(tomorrow, 1), end, 0)
        : end === start
          ? atKst(tomorrow, start, 59)
          : atKst(tomorrow, end, 0);
      const nextSpan = Math.max(60 * 1000, nextEnd.getTime() - nextStart.getTime());
      pickMs =
        mode === "continuous"
          ? nextStart.getTime() + (nextSpan / Math.max(1, total)) * index
          : nextStart.getTime() + Math.floor(Math.random() * nextSpan);
    }
  }

  return new Date(pickMs).toISOString();
}

function resolveSiteKey(tenantId: string | null | undefined, hostname: string): string {
  if (tenantId) return `tenant:${tenantId}`;
  return hostname ? `host:${hostname}` : "legacy";
}

function rolloverDailyCounts(site: BlogWritingSiteRecord): BlogWritingSiteRecord {
  const today = todayKst();
  if (site.publishedDate === today) return site;
  return { ...site, publishedDate: today, publishedToday: 0 };
}

export async function getBlogWritingContext(): Promise<{
  siteKey: string;
  siteUrl: string;
  brandName: string;
  phone: string;
  linkedNaverId: string | null;
  tenantId: string | null;
}> {
  const { config, tenant, isTenant, hostname } = await getResolvedSiteConfig();
  const siteKey = resolveSiteKey(isTenant && tenant ? tenant.id : null, hostname);

  let linkedNaverId: string | null = null;
  if (isTenant && tenant?.naver_account_id) {
    try {
      const account = await fetchNaverAccountById(tenant.naver_account_id);
      linkedNaverId = account?.naver_id || null;
    } catch {
      linkedNaverId = null;
    }
  }

  return {
    siteKey,
    siteUrl: config.url || process.env.SITE_URL || "",
    brandName: config.brandName,
    phone: config.phone,
    linkedNaverId,
    tenantId: tenant?.id ?? null,
  };
}

function toPublic(
  site: BlogWritingSiteRecord,
  linkedNaverId: string | null
): BlogWritingPublicConfig {
  const rolled = rolloverDailyCounts(site);
  const dailyCount = Math.max(0, rolled.dailyCount || 0);
  const { start, end } = resolveWindowHours(rolled);
  return {
    siteKey: rolled.siteKey,
    siteUrl: rolled.siteUrl,
    brandName: rolled.brandName,
    phone: rolled.phone,
    naverId: rolled.naverId,
    hasPassword: !!rolled.naverPassword,
    basePrompt: rolled.basePrompt,
    writingStyle: rolled.writingStyle,
    dailyCount,
    publishMode: rolled.publishMode,
    windowStartHour: start,
    windowEndHour: end,
    enabled: rolled.enabled,
    keywordsText: rolled.keywordQueue.join("\n"),
    keywordQueueCount: rolled.keywordQueue.length,
    publishedToday: rolled.publishedToday,
    publishedDate: rolled.publishedDate,
    dailyRemaining: Math.max(0, dailyCount - rolled.publishedToday),
    linkedNaverIdFromSite: linkedNaverId,
    updatedAt: rolled.updatedAt,
  };
}

function defaultSiteRecord(
  ctx: Awaited<ReturnType<typeof getBlogWritingContext>>
): BlogWritingSiteRecord {
  return {
    siteKey: ctx.siteKey,
    siteUrl: ctx.siteUrl,
    brandName: ctx.brandName,
    phone: ctx.phone,
    naverId: ctx.linkedNaverId || "",
    naverPassword: "",
    basePrompt: "",
    writingStyle: "info",
    dailyCount: 1,
    publishMode: "random",
    windowStartHour: 9,
    windowEndHour: 21,
    enabled: false,
    keywordQueue: [],
    publishedToday: 0,
    publishedDate: todayKst(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPublicBlogWritingConfig(): Promise<BlogWritingPublicConfig> {
  const ctx = await getBlogWritingContext();
  const store = await getBlogWritingStore();
  const existing = store.sites.find((s) => s.siteKey === ctx.siteKey);
  const site = rolloverDailyCounts({
    ...(existing || defaultSiteRecord(ctx)),
    siteUrl: ctx.siteUrl,
    brandName: ctx.brandName,
    phone: ctx.phone,
  });
  return toPublic(site, ctx.linkedNaverId);
}

export interface SaveBlogWritingInput {
  naverId?: string;
  naverPassword?: string;
  clearPassword?: boolean;
  basePrompt?: string;
  writingStyle?: BlogWritingStyle;
  dailyCount?: number;
  publishMode?: BlogPublishMode;
  windowStartHour?: number;
  windowEndHour?: number;
  enabled?: boolean;
  keywordsText?: string;
  appendKeywords?: boolean;
}

function parseHourInput(value: unknown, fallback: number): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return clampHour(n, fallback);
}

export async function saveBlogWritingConfig(
  input: SaveBlogWritingInput
): Promise<BlogWritingPublicConfig> {
  const ctx = await getBlogWritingContext();
  const store = await getBlogWritingStore();
  const idx = store.sites.findIndex((s) => s.siteKey === ctx.siteKey);
  const prev = rolloverDailyCounts(
    idx >= 0 ? store.sites[idx] : defaultSiteRecord(ctx)
  );
  const prevWindow = resolveWindowHours(prev);

  let keywordQueue = prev.keywordQueue;
  if (typeof input.keywordsText === "string") {
    const parsed = parseKeywordList(input.keywordsText);
    keywordQueue = input.appendKeywords
      ? [...prev.keywordQueue, ...parsed.filter((k) => !prev.keywordQueue.includes(k))]
      : parsed;
  }

  const next: BlogWritingSiteRecord = {
    ...prev,
    siteKey: ctx.siteKey,
    siteUrl: ctx.siteUrl,
    brandName: ctx.brandName,
    phone: ctx.phone,
    naverId: (input.naverId ?? prev.naverId).trim().toLowerCase(),
    naverPassword: input.clearPassword
      ? ""
      : typeof input.naverPassword === "string" && input.naverPassword.trim()
        ? input.naverPassword.trim()
        : prev.naverPassword,
    basePrompt: input.basePrompt ?? prev.basePrompt,
    writingStyle:
      input.writingStyle === "review" || input.writingStyle === "info"
        ? input.writingStyle
        : prev.writingStyle,
    dailyCount:
      typeof input.dailyCount === "number" && Number.isFinite(input.dailyCount)
        ? Math.max(0, Math.min(50, Math.floor(input.dailyCount)))
        : prev.dailyCount,
    publishMode:
      input.publishMode === "continuous" || input.publishMode === "random"
        ? input.publishMode
        : prev.publishMode,
    windowStartHour:
      input.windowStartHour !== undefined
        ? parseHourInput(input.windowStartHour, prevWindow.start)
        : prevWindow.start,
    windowEndHour:
      input.windowEndHour !== undefined
        ? parseHourInput(input.windowEndHour, prevWindow.end)
        : prevWindow.end,
    enabled: typeof input.enabled === "boolean" ? input.enabled : prev.enabled,
    keywordQueue,
    updatedAt: new Date().toISOString(),
  };

  if (!next.naverId && ctx.linkedNaverId) {
    next.naverId = ctx.linkedNaverId;
  }

  const sites = [...store.sites];
  if (idx >= 0) sites[idx] = next;
  else sites.push(next);

  const data: BlogWritingStore = {
    updatedAt: new Date().toISOString(),
    sites,
    jobs: store.jobs,
  };
  await saveBlogWritingStore(data);
  return toPublic(next, ctx.linkedNaverId);
}

/** 오늘 남은 한도만큼 키워드를 job으로 발행(배정) */
export async function ensureTodayBlogJobs(siteKey?: string): Promise<number> {
  const store = await getBlogWritingStore();
  const today = todayKst();
  let created = 0;
  const sites = store.sites.map((raw) => rolloverDailyCounts(raw));
  const jobs = [...store.jobs];

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    if (siteKey && site.siteKey !== siteKey) continue;
    if (!site.enabled || !site.naverId) continue;

    const remaining = Math.max(0, site.dailyCount - site.publishedToday);
    if (remaining <= 0 || site.keywordQueue.length === 0) {
      sites[i] = site;
      continue;
    }

    const take = Math.min(remaining, site.keywordQueue.length);
    const selected = site.keywordQueue.slice(0, take);
    const rest = site.keywordQueue.slice(take);
    const now = new Date().toISOString();
    const { start, end } = resolveWindowHours(site);

    for (let j = 0; j < selected.length; j++) {
      const keyword = selected[j];
      jobs.push({
        id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        siteKey: site.siteKey,
        siteUrl: site.siteUrl,
        naverId: site.naverId,
        keyword,
        writingStyle: site.writingStyle,
        basePrompt: site.basePrompt,
        phone: site.phone,
        brandName: site.brandName,
        publishMode: site.publishMode,
        windowStartHour: start,
        windowEndHour: end,
        scheduledAt: scheduleInPublishWindow(site.publishMode, start, end, j, take),
        status: "pending",
        createdAt: now,
      });
      created++;
    }

    sites[i] = {
      ...site,
      keywordQueue: rest,
      publishedToday: site.publishedToday + take,
      publishedDate: today,
      updatedAt: now,
    };
  }

  if (created > 0) {
    await saveBlogWritingStore({
      updatedAt: new Date().toISOString(),
      sites,
      jobs: jobs.slice(-2000),
    });
  }

  return created;
}

export interface BlogWorkerJobPayload {
  id: string;
  siteUrl: string;
  brandName: string;
  phone: string;
  naverId: string;
  naverPassword?: string;
  keyword: string;
  writingStyle: BlogWritingStyle;
  writingStyleLabel: string;
  basePrompt: string;
  publishMode: BlogPublishMode;
  windowStartHour: number;
  windowEndHour: number;
  scheduledAt: string | null;
  siteLink: string;
}

function styleLabel(style: BlogWritingStyle): string {
  return style === "review" ? "후기형" : "정보형";
}

export async function getPendingBlogJobsForNaverId(
  naverId: string
): Promise<BlogWorkerJobPayload[]> {
  const id = naverId.trim().toLowerCase();
  if (!id) return [];

  await ensureTodayBlogJobs();

  const store = await getBlogWritingStore();
  const siteByKey = new Map(store.sites.map((s) => [s.siteKey, s] as const));

  return store.jobs
    .filter(
      (j) =>
        j.naverId.toLowerCase() === id &&
        (j.status === "pending" || j.status === "claimed")
    )
    .sort((a, b) => {
      const at = a.scheduledAt || a.createdAt;
      const bt = b.scheduledAt || b.createdAt;
      return at.localeCompare(bt);
    })
    .map((j) => {
      const site = siteByKey.get(j.siteKey);
      const pw = site?.naverPassword || "";
      const window = resolveWindowHours({
        windowStartHour: j.windowStartHour ?? site?.windowStartHour,
        windowEndHour: j.windowEndHour ?? site?.windowEndHour,
      });
      return {
        id: j.id,
        siteUrl: j.siteUrl,
        brandName: j.brandName,
        phone: j.phone,
        naverId: j.naverId,
        ...(pw ? { naverPassword: pw } : {}),
        keyword: j.keyword,
        writingStyle: j.writingStyle,
        writingStyleLabel: styleLabel(j.writingStyle),
        basePrompt: j.basePrompt,
        publishMode: j.publishMode,
        windowStartHour: window.start,
        windowEndHour: window.end,
        scheduledAt: j.scheduledAt,
        siteLink: j.siteUrl,
      };
    });
}

export async function reportBlogJobResults(
  results: { id: string; status: "completed" | "failed"; error?: string; postUrl?: string }[]
): Promise<number> {
  if (!results.length) return 0;
  const store = await getBlogWritingStore();
  const map = new Map(results.map((r) => [r.id, r]));
  let updated = 0;
  const now = new Date().toISOString();

  const jobs = store.jobs.map((j) => {
    const r = map.get(j.id);
    if (!r) return j;
    updated++;
    return {
      ...j,
      status: r.status,
      completedAt: now,
      error: r.error,
      postUrl: r.postUrl,
    } satisfies BlogWritingJob;
  });

  await saveBlogWritingStore({
    ...store,
    updatedAt: now,
    jobs,
  });
  return updated;
}

export async function claimBlogJobs(jobIds: string[]): Promise<number> {
  if (!jobIds.length) return 0;
  const store = await getBlogWritingStore();
  const set = new Set(jobIds);
  const now = new Date().toISOString();
  let updated = 0;
  const jobs = store.jobs.map((j) => {
    if (!set.has(j.id) || j.status !== "pending") return j;
    updated++;
    return { ...j, status: "claimed" as const, claimedAt: now };
  });
  if (updated > 0) {
    await saveBlogWritingStore({ ...store, updatedAt: now, jobs });
  }
  return updated;
}
