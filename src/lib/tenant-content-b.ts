import type { TenantContentData } from "@/types/tenant";

type Rng = () => number;

interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

interface BusinessArea {
  title: string;
  description: string;
  tags: string[];
  imageIndex: number;
}

interface FaqItem {
  question: string;
  answer: string;
}

function pickOne<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomResponseMinutes(rng: Rng): number {
  return 3 + Math.floor(rng() * 28);
}

const TRUST_BADGES = [
  "🐾 파양·무료분양 전문",
  "📋 투명한 입소 비용 안내",
  "⏱️ 빠른 상담 응답",
  "🏠 새 가족 매칭",
  "📞 365일 상담 접수",
];

const ABOUT_FEATURES: Omit<AboutFeature, "icon">[] = [
  {
    title: "파양견·파양묘 전문 입소",
    description:
      "가정에서 사랑받던 아이들을 안전하게 입소받고, 쾌적한 환경에서 케어합니다.",
  },
  {
    title: "투명한 입소 비용",
    description:
      "항목별로 입소 비용을 투명하게 안내합니다. 고객이 납득할 수 있는 현실적인 비용만 받습니다.",
  },
  {
    title: "책임 있는 분양·입양",
    description:
      "신원 확인과 심층 상담을 거쳐 아이를 사랑할 수 있는 새 가족에게 연결합니다.",
  },
];

const ABOUT_ICONS = ["🐕", "💚", "🏡"];

const BUSINESS_AREA_TEMPLATES: Omit<BusinessArea, "imageIndex">[] = [
  {
    title: "강아지 파양",
    description: "가정견 파양 입소 — 이민·이사·군입대·건강 등 사유별 맞춤 상담.",
    tags: ["강아지파양", "가정견"],
  },
  {
    title: "고양이 파양",
    description: "가정묘 파양 입소 — 다묘 가정·알러지·환경 변화 등 상황별 안내.",
    tags: ["고양이파양", "가정묘"],
  },
  {
    title: "강아지 무료분양",
    description: "입소 아이 중 새 가족을 기다리는 강아지 무료분양·무료입양 매칭.",
    tags: ["강아지무료분양", "무료입양"],
  },
  {
    title: "고양이 무료분양",
    description: "성향·생활 환경을 고려한 고양이 무료분양·입양 상담.",
    tags: ["고양이무료분양", "무료입양"],
  },
];

const PROCESS_STEPS_B = [
  { step: "01", title: "전화·상담", desc: "파양·무료분양 사유와\n아이 정보를 알려주세요" },
  { step: "02", title: "방문·안내", desc: "예약 후 센터 방문,\n입소 비용과 일정을 안내받습니다" },
  { step: "03", title: "입소·케어", desc: "건강검진과 함께\n안전하게 케어를 시작합니다" },
  { step: "04", title: "분양·입양", desc: "적합한 가족을 찾아\n매칭 후 사후 상담을 지원합니다" },
  { step: "05", title: "사후 관리", desc: "입양·분양 후에도\n적응 상태를 함께 확인합니다" },
];

const WHY_US_B = [
  { icon: "🏠", title: "넓고 쾌적한 시설", desc: "과밀 수용 없이 고양이·소형견·중대형견 각각에 맞는 공간을 제공합니다." },
  { icon: "💚", title: "전문 케어팀", desc: "건강검진·목욕·산책·미용 등 아이 중심의 케어 프로그램을 운영합니다." },
  { icon: "⏰", title: "빠른 상담 응답", desc: "전화·온라인 문의에 신속하게 응답하여 입소·분양 일정을 안내합니다." },
  { icon: "📸", title: "입소 후 투명 공개", desc: "입소된 아이의 생활 사진과 건강 상태를 정기적으로 공유합니다." },
  { icon: "🤝", title: "책임 있는 매칭", desc: "신원 확인·심층 상담을 거쳐 아이에게 맞는 새 가족을 연결합니다." },
];

const FAQ_POOL: FaqItem[] = [
  {
    question: "입소 비용은 어떻게 되나요?",
    answer:
      "모든 사설 보호소에는 관리 비용이 발생합니다. 입소 전 항목별 비용을 투명하게 안내하며, 아이 관리에 필요한 현실적인 비용만 받습니다.",
  },
  {
    question: "파양 입소 절차는 어떻게 되나요?",
    answer:
      "전화·상담 후 센터 방문, 입소 비용 확인, 건강검진과 함께 입소가 진행됩니다. 방문은 사전 예약제입니다.",
  },
  {
    question: "무료분양·입양은 어떻게 진행되나요?",
    answer:
      "가정에서 키우던 파양견·파양묘를 새 가족에게 연결합니다. 신원 확인과 심층 상담 후 매칭합니다.",
  },
  {
    question: "입소 후 아이 소식을 받을 수 있나요?",
    answer:
      "입소된 아이의 생활 사진과 건강 상태를 정기적으로 공유합니다. 방문 미팅도 환영합니다.",
  },
  {
    question: "이민·이사·군입대로 파양이 필요한데 가능한가요?",
    answer:
      "네, 피치 못한 사정으로 더 이상 함께하기 어려운 경우 파양 입소 상담을 받으실 수 있습니다.",
  },
];

const MARQUEE_LINES = [
  "강아지·고양이 파양·무료분양 전문",
  "365일 상담 접수",
  "투명한 입소 비용 · 책임 있는 매칭",
  "새 가족을 만난 아이 3,200+",
  "입소 만족도 97%",
];

export function pickDesignBExtras(
  rng: Rng,
  region: string,
  siteName: string,
  firstKeyword: string,
  maxImages: number
): Partial<TenantContentData> {
  const imagePool = shuffle(
    Array.from({ length: maxImages }, (_, i) => i + 1),
    rng
  );
  const responseMin = randomResponseMinutes(rng);

  const businessAreas: BusinessArea[] = BUSINESS_AREA_TEMPLATES.map((item, i) => ({
    ...item,
    imageIndex: imagePool[i % imagePool.length],
  }));

  const aboutFeatures: AboutFeature[] = ABOUT_FEATURES.map((item, i) => ({
    icon: ABOUT_ICONS[i],
    ...item,
  }));

  return {
    heroKeyword: firstKeyword || `${region}강아지파양`,
    trustBadges: TRUST_BADGES,
    marqueeLines: MARQUEE_LINES,
    aboutFeatures,
    businessAreas,
    processSteps: PROCESS_STEPS_B,
    whyUsItems: WHY_US_B.map((item, i) => ({
      num: String(i + 1).padStart(2, "0"),
      title: item.title,
      highlight: item.title,
      sub: item.desc,
    })),
    stats: [
      { label: "분양·입양 매칭", value: "3,200", suffix: "+" },
      { label: "새 가족을 만난 아이", value: "2,850", suffix: "+" },
      { label: "입소 만족도", value: "97", suffix: "%" },
      { label: "평균 응답 시간", value: String(responseMin), suffix: "분" },
    ],
    statsGrid: [
      { label: "분양·입양 매칭", value: "3,200+", suffix: "" },
      { label: "새 가족을 만난 아이", value: "2,850+", suffix: "" },
      { label: "입소 만족도", value: "97", suffix: "%" },
      { label: "평균 응답 시간", value: String(responseMin), suffix: "분" },
      { label: "365일 운영", value: "365", suffix: "일" },
      { label: "입소 건강검진", value: "100", suffix: "%" },
    ],
    faqItems: shuffle(FAQ_POOL, rng).slice(0, 5),
    heroSubline: `파양·무료분양 · ${siteName}`,
    sectionOrder: [
      "about",
      "business",
      "process",
      "whyUs",
      "regions",
      "support",
      "cases",
      "reviews",
      "faq",
      "cta",
    ],
  };
}
