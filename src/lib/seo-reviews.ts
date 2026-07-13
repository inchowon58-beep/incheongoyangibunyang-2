export interface SeoReview {
  name: string;
  area: string;
  text: string;
  imageIndex?: number;
}

const REVIEW_POOL: SeoReview[] = [
  {
    name: "김서연",
    area: "서울 · Gangnam",
    imageIndex: 3,
    text: "상담부터 케어 안내까지 섬세했어요. 폼스키 눈매가 사진보다 더 인상적이고, 아이와 금방 친해졌습니다.",
  },
  {
    name: "이준호",
    area: "부산 · Haeundae",
    imageIndex: 7,
    text: "고가 품종이라 고민이 많았는데, 성격·털관리까지 솔직히 알려주셔서 안심하고 모셨습니다.",
  },
  {
    name: "박민지",
    area: "경기 · Bundang",
    imageIndex: 11,
    text: "하이브리드견답다 싶을 만큼 우아한데 애교도 많아요. 분양 후에도 궁금한 점을 편하게 물어볼 수 있어 좋았습니다.",
  },
  {
    name: "최현우",
    area: "대구 · Suseong",
    imageIndex: 14,
    text: "산책 메이트로 완벽합니다. 사람을 잘 따르고 존재감이 커요. 메종드폼스키 추천으로 만난 인연이 특별합니다.",
  },
  {
    name: "정유진",
    area: "인천 · Songdo",
    imageIndex: 18,
    text: "코트 관리 주기와 미용 팁을 미리 알려주셔서 첫 반려견인데도 부담이 줄었어요.",
  },
  {
    name: "한도윤",
    area: "대전 · Yuseong",
    imageIndex: 21,
    text: "작은 체구인데 존재감이 커요. 품종 지식을 자세히 설명해 주신 점이 신뢰로 이어졌습니다.",
  },
  {
    name: "오수빈",
    area: "광주 · Bonchon",
    imageIndex: 24,
    text: "혼자 있는 시간에도 비교적 안정적이에요. 저희 라이프스타일과 딱 맞는 아이였습니다.",
  },
  {
    name: "윤재혁",
    area: "제주 · Jeju",
    imageIndex: 27,
    text: "고급스러운 외모와 부드러운 성격, 둘 다 만족합니다. 상담이 차분하고 품격 있었어요.",
  },
  {
    name: "신예린",
    area: "서울 · Seongsu",
    imageIndex: 30,
    text: "역사부터 털빠짐까지 안내가 체계적이라, 분양 후에도 관리가 수월했습니다.",
  },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

/** 키워드마다 다른 리뷰 3개 — 본문 글자수(~1500) 보완 + 사진 */
export function getSeoReviewsForKeyword(keyword: string, count = 3): SeoReview[] {
  const seed = hashSeed(keyword.trim() || "review");
  const pool = [...REVIEW_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (seed + i * 17) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).map((r, idx) => ({
    ...r,
    imageIndex: ((((r.imageIndex ?? 1) + seed + idx * 3 - 1) % 30) + 1),
    text:
      idx === 0
        ? `${keyword} 상담을 받으며 ${r.text}`
        : idx === 1
          ? `${r.text} ${keyword} 관련으로도 다시 문의하고 싶습니다.`
          : r.text,
  }));
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 본문+FAQ+리뷰 순수 글자수 */
export function estimateSeoPageCharCount(
  contentHtml: string,
  faqs: { question: string; answer: string }[],
  reviews: SeoReview[]
): number {
  const body = stripHtmlToText(contentHtml);
  const faqText = faqs.map((f) => `${f.question}${f.answer}`).join("");
  const reviewText = reviews.map((r) => `${r.name}${r.area}${r.text}`).join("");
  return body.length + faqText.length + reviewText.length;
}
