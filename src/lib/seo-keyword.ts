import { extractRegionFromKeyword } from "./region-parse";
import { buildTitleWithSeoSuffix } from "./seo-title-keywords";

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function dedupeRegionInCompact(text: string, region: string): string {
  let result = text;
  while (result.includes(region + region)) {
    result = result.replaceAll(region + region, region);
  }
  return result;
}

/**
 * 사용자가 입력한 키워드를 그대로 유지 (임의 띄어쓰기 삽입 금지).
 * 연속 공백만 정리.
 */
export function normalizeSeoKeyword(keyword: string): string {
  return keyword.trim().replace(/\s+/g, " ");
}

/**
 * 본문·FAQ에서 키워드가 글자 사이에 공백이 끼인 경우
 * (예: 서귀포부동 산) → 원본 키워드로 복원.
 */
export function enforceExactKeyword(text: string, keyword: string): string {
  const exact = normalizeSeoKeyword(keyword);
  if (!exact || !text) return text;

  const chars = [...exact];
  if (chars.length < 2) return text;

  const loose = chars.map((ch) => escapeRegExp(ch)).join("\\s*");
  return text.replace(new RegExp(loose, "g"), exact);
}

/** "자양동 자양동철거" → "자양동철거" 등 지역 중복만 제거 (키워드 띄어쓰기 강제 금지) */
export function dedupeRegionInText(text: string, region: string | null): string {
  if (!text?.trim()) return "";
  let result = text.trim().replace(/[ \t]+/g, " ");
  if (!region) return result;

  const esc = escapeRegExp(region);
  result = result.replace(new RegExp(`^${esc}\\s+${esc}(?=[가-힣A-Za-z0-9])`, "gi"), region);
  result = result.replace(new RegExp(`(${esc})\\s+\\1`, "gi"), "$1");
  return result.trim();
}

export function extractRegionForKeyword(keyword: string): string | null {
  return extractRegionFromKeyword(normalizeSeoKeyword(keyword).replace(/\s/g, ""));
}

/** 지역명을 제외한 서비스 문구 (제목·본문 조합용) — 원본 키워드 기준 */
export function extractServicePhrase(keyword: string, region: string | null): string {
  const normalized = normalizeSeoKeyword(keyword);
  if (!region) return normalized;

  const compact = normalized.replace(/\s/g, "");
  if (compact.startsWith(region) && compact.length > region.length) {
    return compact.slice(region.length);
  }

  const esc = escapeRegExp(region);
  const withoutRegion = normalized.replace(new RegExp(`^${esc}\\s*`, "i"), "").trim();
  return withoutRegion || normalized;
}

/** 제목·설명용 핵심 키워드 — 사용자 입력 그대로 */
export function buildSeoCorePhrase(keyword: string): string {
  return normalizeSeoKeyword(keyword);
}

export function polishSeoText(text: string, region: string | null, exactKeyword?: string): string {
  let result = dedupeRegionInText(text, region);
  if (exactKeyword) result = enforceExactKeyword(result, exactKeyword);
  return stripSeoJargon(result);
}

export function polishSeoHtmlContent(html: string, keyword: string): string {
  const exact = normalizeSeoKeyword(keyword);
  const region = extractRegionForKeyword(exact);
  // HTML 전체를 compact 재조립하지 않음 — 키워드만 원본으로 강제
  let result = dedupeRegionInText(html, region);
  result = enforceExactKeyword(result, exact);
  return stripSeoJargon(result);
}

/** 제목에서 상호명 제거 (메타 template에서 1회만 붙임) */
export function stripBrandFromTitle(title: string, brandName: string): string {
  if (!title || !brandName) return title.trim();

  let result = title.trim();
  const esc = escapeRegExp(brandName);

  const suffixPatterns = [
    new RegExp(`\\s*\\|\\s*${esc}\\s*$`, "i"),
    new RegExp(`\\s*-\\s*${esc}\\s*$`, "i"),
    new RegExp(`\\s*·\\s*${esc}\\s*$`, "i"),
  ];
  for (const pattern of suffixPatterns) {
    result = result.replace(pattern, "");
  }

  result = result.replace(
    new RegExp(`(${esc})(\\s*[|·-]\\s*\\1)+`, "gi"),
    "$1"
  );

  return result.trim();
}

export function dedupeBrandInTitle(title: string, brandName: string): string {
  return stripBrandFromTitle(title, brandName);
}

/** 제목에 지역 1회 포함 */
export function ensureRegionInTitle(
  title: string,
  keyword: string,
  region: string | null
): string {
  if (!region) return title;

  const deduped = dedupeRegionInText(title, region);
  if (deduped.includes(region)) return deduped;

  const phrase = extractServicePhrase(keyword, region);
  return `${region} ${phrase}`.trim();
}

/** 페이지 표시용 SEO 제목 (지역 1회, 상호 없음) */
export function buildSeoPageTitle(
  titleAfterTokens: string,
  keyword: string,
  brandName?: string
): string {
  const normalizedKeyword = normalizeSeoKeyword(keyword);
  const region = extractRegionForKeyword(normalizedKeyword);

  let title = titleAfterTokens.trim();
  if (brandName) {
    title = stripBrandFromTitle(title, brandName);
  }
  title = dedupeRegionInText(title, region);
  title = ensureRegionInTitle(title, normalizedKeyword, region);
  if (brandName) {
    title = stripBrandFromTitle(title, brandName);
  }

  return title.slice(0, 55);
}

/** 브라우저 탭용 — 상호 1회 + SEO 키워드 3개 */
export function buildSeoBrowserTitle(pageTitle: string, brandName: string, seed?: string): string {
  const base = stripBrandFromTitle(pageTitle, brandName);
  const main = `${base} | ${brandName}`;
  return buildTitleWithSeoSuffix(main, seed || pageTitle || brandName);
}

const TITLE_TEMPLATES: ((phrase: string, region: string | null) => string)[] = [
  (phrase) => phrase,
  (phrase) => `${phrase} 품종 가이드`,
  (phrase) => `${phrase} 케어 안내`,
  (phrase) => `${phrase} — Soft Guide`,
  (phrase, region) => `${region ? `${region} ` : ""}${phrase}`.trim(),
  (phrase) => `${phrase} 알아보기`,
  (phrase) => `${phrase} 핵심 정리`,
  (phrase) => `${phrase} 자주 묻는 내용`,
  (phrase) => `${phrase} 분양 전 안내`,
  (phrase) => `${phrase} 생활 가이드`,
];

/** 공개 페이지에 노출되면 안 되는 SEO·내부 용어 제거 */
const PUBLIC_JARGON_RE =
  /\s*(SEO|seo|S\.E\.O|검색\s*최적화|콘텐츠\s*최적화|노출\s*최적화|최적화\s*문서|최적화)\s*/gi;

export function stripSeoJargon(text: string): string {
  if (!text) return text;
  return text
    .replace(PUBLIC_JARGON_RE, " ")
    .replace(/\s*[·|]\s*[·|]/g, " · ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[·|-]\s*$/g, "")
    .replace(/^\s*[·|-]\s*/g, "")
    .trim();
}

export function finalizeSeoTitle(title: string, keyword: string): string {
  const normalizedKeyword = normalizeSeoKeyword(keyword);
  const region = extractRegionForKeyword(normalizedKeyword);
  let result = title
    .trim()
    .replace(/\{\{brandName\}\}/gi, "")
    .replace(/\{\{companyName\}\}/gi, "")
    .replace(/\s*[|·-]\s*$/g, "")
    .trim();
  result = stripSeoJargon(result);
  result = dedupeRegionInText(result, region);
  result = enforceExactKeyword(result, normalizedKeyword);
  result = ensureRegionInTitle(result, normalizedKeyword, region);
  result = enforceExactKeyword(result, normalizedKeyword);
  result = stripSeoJargon(result);
  return result.slice(0, 55);
}

export function generateVariedSeoTitle(
  keyword: string,
  region: string | null,
  aiTitle?: string
): string {
  const exact = normalizeSeoKeyword(keyword);
  const resolvedRegion = region || extractRegionForKeyword(exact);
  const phrase = exact;
  const idx = hashText(`${keyword}-${phrase}-title`) % TITLE_TEMPLATES.length;
  const templateTitle = TITLE_TEMPLATES[idx](phrase, resolvedRegion);

  if (!aiTitle?.trim()) {
    return finalizeSeoTitle(templateTitle, keyword);
  }

  const polishedAi = polishSeoText(aiTitle.trim(), resolvedRegion, exact);
  const compactAi = polishedAi.replace(/\s/g, "");
  const aiLooksDuplicate =
    !!resolvedRegion &&
    (new RegExp(
      `${escapeRegExp(resolvedRegion)}\\s+${escapeRegExp(resolvedRegion)}`,
      "i"
    ).test(polishedAi) ||
      compactAi.includes(resolvedRegion + resolvedRegion));

  const aiTooGeneric =
    polishedAi.includes("견적 저렴한") ||
    polishedAi.includes("견적 지원금") ||
    (polishedAi.match(/\|/g)?.length ?? 0) > 0;

  if (aiLooksDuplicate || aiTooGeneric || polishedAi.length > 55) {
    return finalizeSeoTitle(templateTitle, keyword);
  }

  return finalizeSeoTitle(polishedAi, keyword);
}
