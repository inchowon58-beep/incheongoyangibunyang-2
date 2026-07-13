/** 브라우저 탭 끝에 붙일 키워드 풀 — 공개 노출용 (SEO·최적화 용어 없음) */
export const SEO_SUFFIX_KEYWORDS = [
  "꼬똥드툴레아",
  "꼬똥드툴레아분양",
  "메종드꼬똥",
  "프리미엄반려견",
  "소형견분양",
  "반려견분양",
  "꼬똥분양",
  "코튼드툴레아",
  "실내견분양",
  "가족반려견",
  "화이트코트견",
  "럭셔리반려견",
  "꼬똥케어",
  "반려견가이드",
  "분양상담",
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 시드 기준으로 풀에서 중복 없이 n개 선택 (사이트·페이지마다 고정) */
export function pickSeoSuffixKeywords(seed: string, count = 3): string[] {
  const pool = [...SEO_SUFFIX_KEYWORDS];
  let state = hashSeed(seed || "default") || 1;
  const picked: string[] = [];

  while (picked.length < count && pool.length > 0) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const idx = state % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }

  return picked;
}

export function buildTitleWithSeoSuffix(baseTitle: string, seed: string): string {
  const suffix = pickSeoSuffixKeywords(seed, 3).join("·");
  return `${baseTitle} · ${suffix}`;
}
