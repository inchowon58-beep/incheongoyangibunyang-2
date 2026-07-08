import { pickSeoSuffixKeywords } from "@/lib/seo-title-keywords";

/** 로고 하단 감성 슬로건 */
export const LOGO_TAGLINES = [
  "새로운 가족을 만나는 곳",
  "사랑으로 이어지는 만남",
  "버리지 않고, 맡기는 곳",
  "다시 웃을 수 있도록",
  "따뜻한 손길이 기다리는 곳",
  "다음 가족을 찾아주는 곳",
  "안전하게 맡길 수 있는 곳",
  "작은 발걸음, 큰 만남",
  "함께할 수 없을 때도, 안심하세요",
  "아이와 새 가족을 연결합니다",
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createRng(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isSameBrandPhrase(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** 등록 키워드에서 사이트명과 중복되는 항목 제외 */
export function extractDistinctSeoKeywords(keywords: string, siteName: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of keywords.split(/[,\n]/)) {
    const kw = raw.trim();
    if (!kw) continue;
    if (isSameBrandPhrase(kw, siteName)) continue;

    const key = normalizeText(kw);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(kw);
  }

  return result;
}

export function pickLogoTagline(seed: string): string {
  const rng = createRng(`${seed}:logo`);
  const idx = Math.floor(rng() * LOGO_TAGLINES.length);
  return LOGO_TAGLINES[idx];
}

/** 히어로 H1 — 브랜드명 1회 + SEO 키워드 자연스럽게 조합 */
export function buildHeroHeadline(siteName: string, keywords: string, seed: string): string {
  const registered = extractDistinctSeoKeywords(keywords, siteName);
  const suffixPool = pickSeoSuffixKeywords(`${seed}:hero`, 5);
  const parts: string[] = [siteName];

  for (const kw of [...registered, ...suffixPool]) {
    if (parts.length >= 4) break;
    if (isSameBrandPhrase(kw, siteName)) continue;
    if (parts.some((p) => isSameBrandPhrase(p, kw))) continue;
    parts.push(kw);
  }

  if (parts.length === 1) {
    parts.push("강아지파양", "강아지보호소");
  }

  return parts.slice(0, 4).join(" · ");
}

/** 히어로 본문 — 브랜드명 없이 감성·안내 문구 */
export function buildHeroSubcopy(seed: string): string {
  const pool = [
    "파양견·파양묘 입소부터 무료분양·입양 매칭까지, 현실적인 입소 비용으로 투명하게 안내합니다.",
    "이민·이사·군입대 등 피치 못한 사정도, 안전한 입소와 새 가족 매칭으로 함께합니다.",
    "강아지·고양이 파양과 무료분양·입양 상담을 한곳에서 진행합니다.",
    "입소부터 케어, 분양·입양 매칭까지 책임지고 안내하는 보호소입니다.",
  ];
  const rng = createRng(`${seed}:hero-sub`);
  return pool[Math.floor(rng() * pool.length)];
}

/** 예전 생성값(사이트명 반복·SEO 슬로건)이면 갱신 */
export function shouldRefreshLogoTagline(tagline: string | undefined, siteName: string): boolean {
  if (!tagline?.trim()) return true;
  const t = tagline.trim();
  if (isSameBrandPhrase(t, siteName)) return true;
  if (t.includes(siteName) && (t.includes("·") || t.includes("|"))) return true;
  if (normalizeText(t).split(normalizeText(siteName)).length > 2) return true;
  return false;
}

export function shouldRefreshHeroHeadline(
  headline: string | undefined,
  siteName: string
): boolean {
  if (!headline?.trim()) return true;
  const count = headline.split(siteName).length - 1;
  if (count >= 2) return true;
  if (isSameBrandPhrase(headline, siteName)) return true;
  return false;
}
