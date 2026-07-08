import type { TenantContentData } from "@/types/tenant";
import { type SiteDesignId, DEFAULT_SITE_DESIGN } from "@/lib/site-designs";
import { pickDesignBExtras } from "@/lib/tenant-content-b";
import { pickDesignCExtras } from "@/lib/tenant-content-c";
import { pickDesignDExtras } from "@/lib/tenant-content-d";
import {
  buildHeroHeadline,
  buildHeroSubcopy,
  pickLogoTagline,
  shouldRefreshHeroHeadline,
  shouldRefreshLogoTagline,
} from "@/lib/brand-copy";

export type DesignVariant = "classic" | "modern" | "bold";
export type HeaderStyle = "sticky" | "overlay" | "minimal" | "hidden";
export type HomeSectionId =
  | "stats"
  | "support"
  | "cases"
  | "whyUs"
  | "process"
  | "reviews"
  | "inquiry"
  | "partner"
  | "cta";

export interface TenantStatItem {
  label: string;
  value: string;
  suffix: string;
}

export interface TenantCaseItem {
  id: string;
  title: string;
  type: string;
  imageIndex: number;
}

export interface TenantWhyUsItem {
  num: string;
  title: string;
  highlight: string;
  sub: string;
}

export interface TenantProcessItem {
  step: string;
  title: string;
  desc: string;
}

export interface TenantReviewItem {
  name: string;
  business: string;
  text: string;
  rating: number;
}

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionId[] = [
  "stats",
  "support",
  "cases",
  "whyUs",
  "process",
  "reviews",
  "inquiry",
  "partner",
  "cta",
];

export const CASES_COUNT_OPTIONS = [4, 8, 12, 16, 20] as const;

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createRng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickOne<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function extractRegion(keywords: string, siteName: string): string {
  const source = `${keywords} ${siteName}`;
  const match = source.match(
    /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|강남|강북|강서|강동|서초|송파|마포|영등포|용산|성동|광진|동작|관악|노원|일산|분당|수원|성남|안양|부천|김포|파주|고양|화성|평택|천안|청주|전주|창원|김해|거제|울산|제주)[^\s,]*/
  );
  if (match) return match[1];
  const first = keywords.split(/[,\n]/)[0]?.trim() || siteName;
  return first.replace(/입양|보호소|파양|분양|무료/g, "").trim() || "지역";
}

const DESIGN_VARIANTS: DesignVariant[] = ["classic", "modern", "bold"];
const DESIGN_VARIANTS_B: DesignVariant[] = ["modern", "bold"];
const HEADER_STYLES: HeaderStyle[] = ["sticky", "overlay", "minimal", "hidden"];
const HEADER_STYLES_B: HeaderStyle[] = ["minimal", "sticky"];

function randomResponseMinutes(rng: () => number): number {
  return 3 + Math.floor(rng() * 28);
}

function buildPetStats(rng: () => number): TenantStatItem[] {
  const responseMin = randomResponseMinutes(rng);
  const sets: TenantStatItem[][] = [
    [
      { label: "분양·입양 매칭", value: "3,200", suffix: "+" },
      { label: "새 가족을 만난 아이", value: "2,850", suffix: "+" },
      { label: "입소 만족도", value: "97", suffix: "%" },
    ],
    [
      { label: "무료분양·입양", value: "2,800", suffix: "+" },
      { label: "새 가족 매칭", value: "3,150", suffix: "+" },
      { label: "입소 만족도", value: "96", suffix: "%" },
    ],
    [
      { label: "분양·입양 완료", value: "3,400", suffix: "+" },
      { label: "행복한 새 가족", value: "2,720", suffix: "+" },
      { label: "입소 만족도", value: "98", suffix: "%" },
    ],
    [
      { label: "평균 매칭 기간", value: "21", suffix: "일" },
      { label: "새 가족을 만난 아이", value: "2,900", suffix: "+" },
      { label: "입소 만족도", value: "97", suffix: "%" },
    ],
  ];
  const base = pickOne(sets, rng);
  return [...base, { label: "평균 응답 시간", value: String(responseMin), suffix: "분" }];
}

const HERO_BADGES = [
  "강아지·고양이 파양 전문",
  "책임 있는 무료분양 매칭",
  "투명한 입소 비용 안내",
  "가정견·가정묘 파양 입소",
  "믿을 수 있는 요양보육",
  "이민·이사·군입대 파양",
  "강아지·고양이 무료입양",
  "프리미엄 파양·분양 센터",
];

const HERO_INTROS = [
  "입소 상담부터 무료분양 매칭까지",
  "입소 비용 안내부터 새 가족 찾기까지",
  "파양견·파양묘 입소부터 분양까지",
  "투명한 입소 비용과 맞춤 케어까지",
  "상담부터 입양 후 관리까지",
  "현실적인 입소와 책임 매칭까지",
];

const HERO_CLOSINGS = [
  "를 한곳에서 진행합니다",
  "가 따뜻하게 함께합니다",
  "로 안전하게 연결합니다",
  "이 든든하게 돕습니다",
  "가 끝까지 함께합니다",
];

const ABOUT_SNIPPETS = [
  "더 이상 함께하기 어려운 가정견·가정묘 파양 입소를 전문 상담으로 진행합니다.",
  "강아지·고양이 무료분양·무료입양 매칭으로 새 가족을 찾아드립니다.",
  "입소 비용을 항목별로 투명하게 안내하며 현실적인 관리비만 받습니다.",
  "이민, 이사, 군입대, 임신·출산, 알러지 등 다양한 파양 사유를 이해하고 돕습니다.",
  "건강검진·케어·생활 사진 공유로 입소 후에도 안심하실 수 있습니다.",
  "분양·입양 후에도 상담과 적응 확인을 지원합니다.",
];

const SUPPORT_BLURBS = [
  "모든 사설 보호소에는 입소 관리 비용이 발생합니다. 무료 입소를 내세우는 곳은 방문 후 과도한 비용을 요구할 수 있으니 주의하세요.",
  "아가펫보호소는 아이 관리에 필요한 현실적인 비용만 투명하게 안내합니다. 입소 전 항목별 비용 안내를 받으실 수 있습니다.",
  "파양견·파양묘 입소, 무료분양·무료입양 — 전화 한 통으로 시작하세요.",
  "입소 기간·케어 항목에 따라 비용이 달라집니다. 방문 상담 시 정확한 입소 비용을 안내해 드립니다.",
];

const WHY_US_TITLES = [
  "파양·분양을 믿을 수 있는 이유",
  "보호자들이 다시 찾는 이유",
  "입양·분양자들이 추천하는 이유",
  "투명한 입소로 선택받는 이유",
];

const STATS_SETS: TenantStatItem[][] = [
  [
    { label: "분양·입양 매칭", value: "3,200", suffix: "+" },
    { label: "새 가족을 만난 아이", value: "2,850", suffix: "+" },
    { label: "입소 만족도", value: "97", suffix: "%" },
  ],
  [
    { label: "무료분양·입양", value: "2,800", suffix: "+" },
    { label: "새 가족 매칭", value: "3,150", suffix: "+" },
    { label: "입소 만족도", value: "96", suffix: "%" },
  ],
  [
    { label: "분양·입양 완료", value: "3,400", suffix: "+" },
    { label: "행복한 새 가족", value: "2,720", suffix: "+" },
    { label: "입소 만족도", value: "98", suffix: "%" },
  ],
  [
    { label: "평균 매칭 기간", value: "21", suffix: "일" },
    { label: "새 가족을 만난 아이", value: "2,900", suffix: "+" },
    { label: "입소 만족도", value: "97", suffix: "%" },
  ],
];

const WHY_US_SETS: TenantWhyUsItem[][] = [
  [
    { num: "01", title: "투명한 입소", highlight: "항목별 안내", sub: "현실적 비용" },
    { num: "02", title: "책임 매칭", highlight: "파양·분양", sub: "맞춤 상담" },
    { num: "03", title: "입소 후 공개", highlight: "생활 사진", sub: "방문 환영" },
  ],
  [
    { num: "01", title: "건강 관리", highlight: "검진·케어", sub: "철저 관리" },
    { num: "02", title: "넓은 시설", highlight: "과밀 없음", sub: "쾌적 환경" },
    { num: "03", title: "전문 상담", highlight: "파양·분양", sub: "24시 접수" },
  ],
  [
    { num: "01", title: "맞춤 분양", highlight: "성향 분석", sub: "가족 매칭" },
    { num: "02", title: "교육·상담", highlight: "입양 전후", sub: "지속 지원" },
    { num: "03", title: "사후 관리", highlight: "적응 확인", sub: "책임 상담" },
  ],
];

const PROCESS_SETS: TenantProcessItem[][] = [
  [
    { step: "01", title: "전화·상담", desc: "파양·무료분양 사유와\n아이 정보를 알려주세요" },
    { step: "02", title: "방문·안내", desc: "예약 후 센터 방문,\n입소 비용과 일정을 안내받습니다" },
    { step: "03", title: "입소·매칭", desc: "케어 후 적합한 가족에게\n무료분양·입양을 연결합니다" },
  ],
  [
    { step: "01", title: "온라인·전화 상담", desc: "파양 사유와 생활 환경을\n파악합니다" },
    { step: "02", title: "센터 방문", desc: "아이와 직접 만나\n입소 비용을 확인합니다" },
    { step: "03", title: "분양·사후 관리", desc: "매칭 후에도\n상담을 지원합니다" },
  ],
  [
    { step: "01", title: "무료분양 문의", desc: "희망 조건과\n생활 환경을 알려주세요" },
    { step: "02", title: "만남·상담", desc: "아이들과 직접 만나\n성향을 확인합니다" },
    { step: "03", title: "입양·적응 확인", desc: "입양 후 적응 상태를\n함께 확인합니다" },
  ],
];

const REVIEW_POOL: TenantReviewItem[] = [
  {
    name: "이*진",
    business: "강아지 파양",
    text: "이민 준비로 더 이상 함께할 수 없어 맡겼는데, 입소 비용을 항목별로 투명하게 안내해 주셔서 안심했습니다.",
    rating: 5,
  },
  {
    name: "박*수",
    business: "고양이 무료분양",
    text: "고양이 무료분양을 희망했는데 성향에 맞는 가족을 찾아주셨습니다. 상담 응답도 빠르고 친절했습니다.",
    rating: 5,
  },
  {
    name: "최*영",
    business: "강아지 무료분양",
    text: "이사로 키울 공간이 없어 파양을 고민하다 입소했습니다. 아이 상태 사진을 자주 보내주셔서 마음이 놓였습니다.",
    rating: 5,
  },
  {
    name: "김*호",
    business: "고양이 파양",
    text: "알러지가 심해져 파양했습니다. 가정묘 파양이라는 점을 이해해 주시고 세심하게 케어해 주셨어요.",
    rating: 5,
  },
  {
    name: "정*미",
    business: "강아지 무료입양",
    text: "가정에서 키우던 강아지를 무료입양 받았습니다. 입양 전·후 상담이 꼼꼼해서 믿을 수 있었습니다.",
    rating: 5,
  },
  {
    name: "한*우",
    business: "군입대 파양",
    text: "입대 전에 맡길 곳을 찾다가 상담했습니다. 현실적인 입소 비용만 안내받고, 제대 후에도 아이 소식을 들을 수 있어 감사합니다.",
    rating: 5,
  },
  {
    name: "윤*아",
    business: "고양이 무료분양",
    text: "다묘 가정이라 분양을 맡겼는데, 3주 만에 좋은 분을 연결해 주셨습니다.",
    rating: 5,
  },
  {
    name: "서*현",
    business: "강아지 파양",
    text: "노령견이라 케어가 힘들어 입소했습니다. 건강검진부터 일상 케어까지 꼼꼼해서 믿고 맡길 수 있었습니다.",
    rating: 5,
  },
  {
    name: "조*민",
    business: "고양이 파양",
    text: "무료 입소를 내세우는 곳과 달리, 처음부터 비용을 솔직히 알려주셔서 신뢰가 갔습니다.",
    rating: 5,
  },
  {
    name: "강*희",
    business: "강아지 무료분양",
    text: "파양견 무료분양을 받았는데 아이 성향 설명이 정확했고, 적응 상담도 도움이 됐습니다.",
    rating: 5,
  },
  {
    name: "오*준",
    business: "이사 파양",
    text: "전세 계약 문제로 이사가 급해졌는데, 2시간 내 상담 연락을 받고 바로 입소 일정을 잡았습니다.",
    rating: 5,
  },
  {
    name: "신*래",
    business: "고양이 무료입양",
    text: "처음 고양이를 키우는데 맞춤 상담 덕분에 우리 집 환경에 잘 맞는 아이를 만났습니다.",
    rating: 5,
  },
];

const CASE_TEMPLATES = [
  { title: "{region} 이민 전 강아지 파양", type: "강아지파양" },
  { title: "{region} 군입대 고양이 파양", type: "고양이파양" },
  { title: "{region} 이사로 인한 강아지 무료분양", type: "강아지무료분양" },
  { title: "{region} 알러지 발현 고양이 파양", type: "고양이파양" },
  { title: "{region} 임신·출산 파양 입소", type: "강아지파양" },
  { title: "{region} 노령견 장기 위탁", type: "강아지파양" },
  { title: "{region} 다묘 가정 고양이 무료분양", type: "고양이무료분양" },
  { title: "{region} 유학 전 반려견 파양", type: "강아지파양" },
  { title: "{region} 중형견 무료분양 매칭", type: "강아지무료분양" },
  { title: "{region} 거주환경 변화 파양", type: "고양이파양" },
  { title: "{region} 맞춤 강아지 무료입양", type: "강아지무료입양" },
  { title: "{region} 입소 후 분양 완료", type: "무료분양 완료" },
  { title: "{region} 다견 갈등 분리 파양", type: "강아지파양" },
  { title: "{region} 보호자 질병 파양 입소", type: "고양이파양" },
  { title: "{region} 고양이 무료입양", type: "고양이무료입양" },
  { title: "{region} 해외 발령 파양", type: "강아지파양" },
  { title: "{region} 입소 건강검진·케어", type: "입소·케어" },
  { title: "{region} 투명 입소비 안내", type: "입소·상담" },
  { title: "{region} 장기 입소 위탁", type: "강아지파양" },
  { title: "{region} 분양 후 사후 상담", type: "사후관리" },
];

function pickCases(
  rng: () => number,
  count: number,
  region: string,
  maxImages: number
): TenantCaseItem[] {
  const imagePool = shuffle(
    Array.from({ length: maxImages }, (_, i) => i + 1),
    rng
  );
  const templates = shuffle(CASE_TEMPLATES, rng);
  return Array.from({ length: count }, (_, i) => ({
    id: `case-${i + 1}`,
    title: templates[i % templates.length].title.replace("{region}", region),
    type: templates[i % templates.length].type,
    imageIndex: imagePool[i % imagePool.length],
  }));
}

function pickSectionOrder(rng: () => number): HomeSectionId[] {
  const optionalHidden = shuffle(
    ["partner", "cta", "stats", "reviews"] as HomeSectionId[],
    rng
  );
  const hideCount = Math.floor(rng() * 2);
  const hidden = new Set(optionalHidden.slice(0, hideCount));
  const core = shuffle(
    DEFAULT_HOME_SECTION_ORDER.filter((id) => !hidden.has(id)),
    rng
  );
  return core;
}

/** 서브도메인 시드로 사이트마다 다른 문구·레이아웃·이미지 패키지 생성 */
export function pickTenantContentPackage(
  seed: string,
  siteName: string,
  keywords: string,
  bodyContent: string,
  imageCount = 20,
  siteDesign: SiteDesignId = DEFAULT_SITE_DESIGN
): TenantContentData {
  const designSeed =
    siteDesign === "b"
      ? `${seed}:design-b`
      : siteDesign === "c"
        ? `${seed}:design-c`
        : siteDesign === "d"
          ? `${seed}:design-d`
          : seed;
  const layoutSeed = hashString(designSeed);
  const rng = createRng(layoutSeed);
  const isDesignB = siteDesign === "b";
  const isDesignC = siteDesign === "c";
  const isDesignD = siteDesign === "d";
  const isAltDesign = isDesignB || isDesignC || isDesignD;
  const maxImages = Math.max(4, imageCount);
  const region = extractRegion(keywords, siteName);
  const firstKeyword = keywords.split(/[,\n]/)[0]?.trim() || siteName;
  const intro = pickOne(HERO_INTROS, rng);
  const closing = pickOne(HERO_CLOSINGS, rng);
  const about = bodyContent.trim() || pickOne(ABOUT_SNIPPETS, rng);
  const casesCount = pickOne([...CASES_COUNT_OPTIONS], rng);
  const heroImageIndex = Math.floor(rng() * maxImages) + 1;
  const supportImageIndex = Math.floor(rng() * maxImages) + 1;
  const reviews = shuffle(REVIEW_POOL, rng).slice(0, 3 + Math.floor(rng() * 7));

  const base: TenantContentData = {
    siteDesign,
    layoutSeed,
    headerStyle: pickOne(isAltDesign ? HEADER_STYLES_B : HEADER_STYLES, rng),
    sectionOrder: isAltDesign ? [] : pickSectionOrder(rng),
    designVariant: pickOne(isAltDesign ? DESIGN_VARIANTS_B : DESIGN_VARIANTS, rng),
    heroBadge: pickOne(HERO_BADGES, rng),
    heroIntro: intro,
    heroClosing: closing,
    heroLead: `${intro}\n${siteName}${closing}`,
    heroImageIndex,
    supportImageIndex,
    aboutText: about,
    supportBlurb: pickOne(SUPPORT_BLURBS, rng),
    whyUsTitle: pickOne(WHY_US_TITLES, rng),
    whyUsItems: pickOne(WHY_US_SETS, rng),
    processSteps: pickOne(PROCESS_SETS, rng),
    reviews,
    reviewsSatisfaction: `${94 + Math.floor(rng() * 5)}%`,
    stats: buildPetStats(rng),
    casesCount,
    casesItems: pickCases(rng, casesCount, region, maxImages),
    tagline: pickLogoTagline(seed),
    heroHeadline: buildHeroHeadline(siteName, keywords, seed),
    heroSubcopy: buildHeroSubcopy(seed),
    description: about.slice(0, 160) || `${siteName} 공식 사이트`,
    keywords,
    body: bodyContent || about,
  };

  if (isDesignB) {
    const bExtras = pickDesignBExtras(rng, region, siteName, firstKeyword, maxImages);
    return { ...base, ...bExtras };
  }

  if (isDesignC) {
    const casesItems = base.casesItems || [];
    const cExtras = pickDesignCExtras(
      rng,
      region,
      siteName,
      firstKeyword,
      maxImages,
      casesItems
    );
    return { ...base, ...cExtras };
  }

  if (isDesignD) {
    const casesItems = base.casesItems || [];
    const dExtras = pickDesignDExtras(
      rng,
      region,
      siteName,
      firstKeyword,
      maxImages,
      casesItems
    );
    return { ...base, ...dExtras };
  }

  return {
    ...base,
    sectionOrder: pickSectionOrder(rng),
  };
}

/** DB에 저장된 테넌트 UI — 없으면 시드로 생성 (기존 사이트 호환) */
export function resolveTenantContentData(
  content: TenantContentData | undefined | null,
  subdomain: string,
  siteName: string,
  keywords = "",
  bodyContent = "",
  imageCount = 20
): TenantContentData {
  const kw = keywords || content?.keywords || "";
  const pkg = pickTenantContentPackage(
    subdomain,
    siteName,
    kw,
    bodyContent || content?.body || "",
    imageCount,
    content?.siteDesign || DEFAULT_SITE_DESIGN
  );

  const tagline =
    content?.tagline && !shouldRefreshLogoTagline(content.tagline, siteName)
      ? content.tagline
      : pickLogoTagline(subdomain);

  const heroHeadline =
    content?.heroHeadline && !shouldRefreshHeroHeadline(content.heroHeadline, siteName)
      ? content.heroHeadline
      : buildHeroHeadline(siteName, kw, subdomain);

  const heroSubcopy = content?.heroSubcopy || buildHeroSubcopy(subdomain);

  if (content?.layoutSeed != null && content.sectionOrder?.length) {
    return {
      ...content,
      tagline,
      heroHeadline,
      heroSubcopy,
    };
  }

  return {
    ...pkg,
    tagline,
    heroHeadline,
    heroSubcopy,
    keywords: kw || pkg.keywords,
    body: content?.body || pkg.body,
    description: content?.description || pkg.description,
    aboutText: content?.aboutText || pkg.aboutText,
  };
}

export function getDefaultStats(): TenantStatItem[] {
  return buildPetStats(createRng(1));
}
