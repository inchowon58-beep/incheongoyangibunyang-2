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
  enabled: boolean;
  /** 관리자 텍스트에어리어용 — 줄바꿈 구분 */
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

function resolveSiteKey(tenantId: string | null | undefined, hostname: string): string {
  if (tenantId) return `tenant:${tenantId}`;
  return hostname ? `host:${hostname}` : "legacy";
}

function rolloverDailyCounts(site: BlogWritingSiteRecord): BlogWritingSiteRecord {
  const today = todayKst();
  if (site.publishedDate === today) return site;
  return { ...site, publishedDate: today, publishedToday: 0 };
}

function randomTimeTodayIso(): string {
  const now = new Date();
  const startHour = 9;
  const endHour = 21;
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
  const minute = Math.floor(Math.random() * 60);
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < now.getTime()) {
    d.setTime(now.getTime() + 5 * 60 * 1000 + Math.floor(Math.random() * 30 * 60 * 1000));
  }
  return d.toISOString();
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
  enabled?: boolean;
  /** 전체 키워드 텍스트(줄/쉼표) — 큐를 이 목록으로 교체 */
  keywordsText?: string;
  /** true면 기존 큐 뒤에 추가 */
  appendKeywords?: boolean;
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
    enabled: typeof input.enabled === "boolean" ? input.enabled : prev.enabled,
    keywordQueue,
    updatedAt: new Date().toISOString(),
  };

  // 사이트 등록 연동 아이디가 있고 입력이 비었으면 자동 채움
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
        scheduledAt:
          site.publishMode === "random"
            ? randomTimeTodayIso()
            : new Date(Date.now() + j * 3 * 60 * 1000).toISOString(),
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
  /** 설정된 경우만 — 없으면 VM 로컬 비밀번호 사용 */
  naverPassword?: string;
  keyword: string;
  writingStyle: BlogWritingStyle;
  writingStyleLabel: string;
  basePrompt: string;
  publishMode: BlogPublishMode;
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
  const sitePasswords = new Map(
    store.sites.map((s) => [s.siteKey, s.naverPassword] as const)
  );

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
      const pw = sitePasswords.get(j.siteKey) || "";
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
