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
  /** 블로그 사진 CDN 폴더 URL */
  imageCdn: string;
  /** CDN 이미지 개수 (01.webp ~) */
  imageCount: number;
  /** 사이트 기본 CDN (비우면 이 값 사용 가능) */
  defaultImageCdn: string;
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

function normalizeImageCdn(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/?$/, "/");
}

function resolveImageSettings(
  site: { imageCdn?: string; imageCount?: number },
  defaults: { imageCdn: string; imageCount: number }
): { imageCdn: string; imageCount: number } {
  const cdn = normalizeImageCdn(site.imageCdn || "") || normalizeImageCdn(defaults.imageCdn);
  const countRaw = site.imageCount ?? defaults.imageCount;
  const imageCount =
    Number.isFinite(countRaw) && countRaw > 0 ? Math.min(500, Math.floor(countRaw)) : 50;
  return { imageCdn: cdn, imageCount };
}

/** VM용 — CDN 폴더에서 N번째 이미지 URL (01.webp 규칙) */
export function buildBlogImageUrl(imageCdn: string, index: number): string {
  const base = imageCdn.replace(/\/$/, "");
  const num = Math.max(1, Math.floor(index));
  return `${base}/${String(num).padStart(2, "0")}.webp`;
}

export async function getBlogWritingContext(): Promise<{
  siteKey: string;
  siteUrl: string;
  brandName: string;
  phone: string;
  linkedNaverId: string | null;
  tenantId: string | null;
  defaultImageCdn: string;
  defaultImageCount: number;
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
    defaultImageCdn: normalizeImageCdn(config.imageCdn || ""),
    defaultImageCount: Math.max(1, config.imageCount || 50),
  };
}

function toPublic(
  site: BlogWritingSiteRecord,
  linkedNaverId: string | null,
  defaults: { imageCdn: string; imageCount: number }
): BlogWritingPublicConfig {
  const rolled = rolloverDailyCounts(site);
  const dailyCount = Math.max(0, rolled.dailyCount || 0);
  const { start, end } = resolveWindowHours(rolled);
  const images = resolveImageSettings(rolled, defaults);
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
    imageCdn: images.imageCdn,
    imageCount: images.imageCount,
    defaultImageCdn: defaults.imageCdn,
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
    imageCdn: ctx.defaultImageCdn,
    imageCount: ctx.defaultImageCount,
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
  const defaults = {
    imageCdn: ctx.defaultImageCdn,
    imageCount: ctx.defaultImageCount,
  };
  const site = rolloverDailyCounts({
    ...(existing || defaultSiteRecord(ctx)),
    siteUrl: ctx.siteUrl,
    brandName: ctx.brandName,
    phone: ctx.phone,
  });
  const today = todayKst();
  const assigned = existing
    ? countTodayAssignedJobs(store.jobs, site.siteKey, today)
    : 0;
  return toPublic(
    { ...site, publishedToday: assigned, publishedDate: today },
    ctx.linkedNaverId,
    defaults
  );
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
  imageCdn?: string;
  imageCount?: number;
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
  const defaults = {
    imageCdn: ctx.defaultImageCdn,
    imageCount: ctx.defaultImageCount,
  };
  const prevImages = resolveImageSettings(prev, defaults);

  let keywordQueue = prev.keywordQueue;
  if (typeof input.keywordsText === "string") {
    const parsed = parseKeywordList(input.keywordsText);
    keywordQueue = input.appendKeywords
      ? [...prev.keywordQueue, ...parsed.filter((k) => !prev.keywordQueue.includes(k))]
      : parsed;
  }

  const nextImageCdn =
    typeof input.imageCdn === "string"
      ? normalizeImageCdn(input.imageCdn) || prevImages.imageCdn
      : prevImages.imageCdn;
  const nextImageCount =
    input.imageCount !== undefined
      ? Math.max(1, Math.min(500, Math.floor(Number(input.imageCount) || prevImages.imageCount)))
      : prevImages.imageCount;

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
    imageCdn: nextImageCdn,
    imageCount: nextImageCount,
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
  return toPublic(next, ctx.linkedNaverId, defaults);
}

function jobCreatedDateKst(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** 오늘(KST) 이미 배정·진행·완료된 job 수 (실패 제외 → 재시도 가능) */
function countTodayAssignedJobs(
  jobs: BlogWritingJob[],
  siteKey: string,
  today: string
): number {
  return jobs.filter((j) => {
    if (j.siteKey !== siteKey) return false;
    if (j.status === "failed") return false;
    return jobCreatedDateKst(j.createdAt) === today;
  }).length;
}

function keywordsAlreadyAssignedToday(
  jobs: BlogWritingJob[],
  siteKey: string,
  today: string
): Set<string> {
  const set = new Set<string>();
  for (const j of jobs) {
    if (j.siteKey !== siteKey) continue;
    if (j.status === "failed") continue;
    if (jobCreatedDateKst(j.createdAt) !== today) continue;
    set.add(j.keyword.trim().toLowerCase());
  }
  return set;
}

export interface BlogWorkerDiagnostics {
  naverId: string;
  matchingSites: number;
  enabledSites: number;
  sites: {
    siteKey: string;
    siteUrl: string;
    enabled: boolean;
    naverId: string;
    dailyCount: number;
    publishedToday: number;
    keywordQueueCount: number;
    pendingJobs: number;
    claimedJobs: number;
    completedToday: number;
  }[];
  pendingOrClaimedJobs: number;
  hint: string;
}

export async function getBlogWorkerDiagnostics(
  naverId: string
): Promise<BlogWorkerDiagnostics> {
  const id = naverId.trim().toLowerCase();
  const store = await getBlogWritingStore();
  const today = todayKst();
  const sites = store.sites
    .filter((s) => (s.naverId || "").trim().toLowerCase() === id)
    .map((s) => {
      const rolled = rolloverDailyCounts(s);
      const assigned = countTodayAssignedJobs(store.jobs, rolled.siteKey, today);
      return {
        siteKey: rolled.siteKey,
        siteUrl: rolled.siteUrl,
        enabled: rolled.enabled,
        naverId: rolled.naverId,
        dailyCount: rolled.dailyCount,
        publishedToday: assigned,
        keywordQueueCount: rolled.keywordQueue.length,
        pendingJobs: store.jobs.filter(
          (j) => j.siteKey === rolled.siteKey && j.status === "pending"
        ).length,
        claimedJobs: store.jobs.filter(
          (j) => j.siteKey === rolled.siteKey && j.status === "claimed"
        ).length,
        completedToday: store.jobs.filter(
          (j) =>
            j.siteKey === rolled.siteKey &&
            j.status === "completed" &&
            jobCreatedDateKst(j.createdAt) === today
        ).length,
      };
    });

  const pendingOrClaimedJobs = store.jobs.filter(
    (j) =>
      j.naverId.toLowerCase() === id &&
      (j.status === "pending" || j.status === "claimed")
  ).length;

  let hint = "정상적으로 job을 만들 수 있는 상태입니다. 다시 폴링해 보세요.";
  if (sites.length === 0) {
    hint =
      "이 naverId로 저장된 블로그작성 설정이 없습니다. inchon.cattery.co.kr/admin/blog-writing 에서 네이버 아이디를 맞추고 설정 저장하세요. (다른 도메인에 저장했을 수 있음)";
  } else if (!sites.some((s) => s.enabled)) {
    hint = "설정은 있으나 '발행 사용'이 OFF 입니다. ON 후 저장하세요.";
  } else if (!sites.some((s) => s.keywordQueueCount > 0)) {
    hint = "키워드 큐가 비어 있습니다. 작성 키워드를 넣고 저장하세요.";
  } else if (!sites.some((s) => s.publishedToday < s.dailyCount)) {
    hint =
      "오늘 하루 발행 개수 한도를 모두 사용했습니다. 내일 다시 생성되거나, 하루 발행 개수를 늘린 뒤 저장하세요.";
  } else if (pendingOrClaimedJobs === 0) {
    hint =
      "한도·키워드는 남아 있는데 pending job이 없습니다. 설정 저장을 한 번 더 누르거나 API를 다시 호출하면 ensure가 job을 만듭니다.";
  }

  return {
    naverId: id,
    matchingSites: sites.length,
    enabledSites: sites.filter((s) => s.enabled).length,
    sites,
    pendingOrClaimedJobs,
    hint,
  };
}

/** 오늘 남은 한도만큼 키워드를 job으로 발행(배정) */
export async function ensureTodayBlogJobs(siteKey?: string): Promise<number> {
  const store = await getBlogWritingStore();
  const today = todayKst();
  let created = 0;
  let touched = false;
  const sites = store.sites.map((raw) => rolloverDailyCounts(raw));
  const jobs = [...store.jobs];

  for (let i = 0; i < sites.length; i++) {
    let site = sites[i];
    if (siteKey && site.siteKey !== siteKey) continue;

    // 실제 job 기준으로 오늘 배정 수 재동기화 (카운터 불일치 복구)
    const assigned = countTodayAssignedJobs(jobs, site.siteKey, today);
    if (
      site.publishedToday !== assigned ||
      site.publishedDate !== today
    ) {
      site = {
        ...site,
        publishedToday: assigned,
        publishedDate: today,
      };
      sites[i] = site;
      touched = true;
    }

    if (!site.enabled || !site.naverId) continue;

    const remaining = Math.max(0, site.dailyCount - assigned);
    if (remaining <= 0 || site.keywordQueue.length === 0) {
      continue;
    }

    const already = keywordsAlreadyAssignedToday(jobs, site.siteKey, today);
    const candidates = site.keywordQueue.filter(
      (k) => !already.has(k.trim().toLowerCase())
    );
    if (candidates.length === 0) continue;

    const take = Math.min(remaining, candidates.length);
    const selected = candidates.slice(0, take);
    const now = new Date().toISOString();
    const { start, end } = resolveWindowHours(site);
    const images = resolveImageSettings(site, {
      imageCdn: site.imageCdn || "",
      imageCount: site.imageCount || 50,
    });

    for (let j = 0; j < selected.length; j++) {
      const keyword = selected[j];
      jobs.push({
        id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        siteKey: site.siteKey,
        siteUrl: site.siteUrl,
        naverId: site.naverId.trim().toLowerCase(),
        keyword,
        writingStyle: site.writingStyle,
        basePrompt: site.basePrompt,
        phone: site.phone,
        brandName: site.brandName,
        publishMode: site.publishMode,
        windowStartHour: start,
        windowEndHour: end,
        imageCdn: images.imageCdn,
        imageCount: images.imageCount,
        scheduledAt: scheduleInPublishWindow(site.publishMode, start, end, j, take),
        status: "pending",
        createdAt: now,
      });
      created++;
    }

    // 키워드는 완료 시 큐에서 제거. 배정만으로는 유지 → job 유실 시 재생성 가능
    sites[i] = {
      ...site,
      publishedToday: assigned + take,
      publishedDate: today,
      updatedAt: now,
    };
    touched = true;
  }

  if (created > 0 || touched) {
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
  /** 사진 폴더 예: https://image.cattery.co.kr/pomsky/ */
  imageCdn: string;
  imageCount: number;
  /** 랜덤 1장 예시 URL (VM이 그대로 써도 됨) */
  sampleImageUrl: string;
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

  // 해당 naverId 사이트만 우선 배정 시도
  const storeBefore = await getBlogWritingStore();
  const matchingKeys = storeBefore.sites
    .filter((s) => (s.naverId || "").trim().toLowerCase() === id && s.enabled)
    .map((s) => s.siteKey);

  if (matchingKeys.length === 0) {
    await ensureTodayBlogJobs();
  } else {
    for (const key of matchingKeys) {
      await ensureTodayBlogJobs(key);
    }
  }

  const store = await getBlogWritingStore();
  const siteByKey = new Map(store.sites.map((s) => [s.siteKey, s] as const));

  return store.jobs
    .filter(
      (j) =>
        j.naverId.trim().toLowerCase() === id &&
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
      const images = resolveImageSettings(
        {
          imageCdn: j.imageCdn ?? site?.imageCdn,
          imageCount: j.imageCount ?? site?.imageCount,
        },
        { imageCdn: site?.imageCdn || "", imageCount: site?.imageCount || 50 }
      );
      const sampleIndex =
        (Math.abs(hashKeyword(j.keyword)) % Math.max(1, images.imageCount)) + 1;
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
        imageCdn: images.imageCdn,
        imageCount: images.imageCount,
        sampleImageUrl: images.imageCdn
          ? buildBlogImageUrl(images.imageCdn, sampleIndex)
          : "",
        scheduledAt: j.scheduledAt,
        siteLink: j.siteUrl,
      };
    });
}

function hashKeyword(keyword: string): number {
  let h = 0;
  for (let i = 0; i < keyword.length; i++) {
    h = (h << 5) - h + keyword.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export async function reportBlogJobResults(
  results: { id: string; status: "completed" | "failed"; error?: string; postUrl?: string }[]
): Promise<number> {
  if (!results.length) return 0;
  const store = await getBlogWritingStore();
  const map = new Map(results.map((r) => [r.id, r]));
  let updated = 0;
  const now = new Date().toISOString();
  const completedKeywordsBySite = new Map<string, Set<string>>();

  const jobs = store.jobs.map((j) => {
    const r = map.get(j.id);
    if (!r) return j;
    updated++;
    if (r.status === "completed") {
      const set = completedKeywordsBySite.get(j.siteKey) || new Set<string>();
      set.add(j.keyword.trim().toLowerCase());
      completedKeywordsBySite.set(j.siteKey, set);
    }
    return {
      ...j,
      status: r.status,
      completedAt: now,
      error: r.error,
      postUrl: r.postUrl,
    } satisfies BlogWritingJob;
  });

  const sites = store.sites.map((site) => {
    const done = completedKeywordsBySite.get(site.siteKey);
    if (!done || done.size === 0) return site;
    return {
      ...site,
      keywordQueue: site.keywordQueue.filter(
        (k) => !done.has(k.trim().toLowerCase())
      ),
      updatedAt: now,
    };
  });

  await saveBlogWritingStore({
    ...store,
    updatedAt: now,
    sites,
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
