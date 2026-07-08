import type { TenantContentData } from "@/types/tenant";

type Rng = () => number;

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

const HERO_EYEBROWS = [
  "Premium Pet Care Center",
  "Pet Surrender & Adoption",
  "Trusted Pet Care Partner",
];

const ABOUT_BULLETS = [
  "투명한 입소 비용과 책임 있는 파양·분양 매칭",
  "강아지·고양이 파양 입소부터 무료분양·입양까지",
  "이민·이사·군입대 등 다양한 파양 사유 맞춤 상담",
  "입소 후 생활 사진 공유와 사후 관리까지",
];

const SERVICE_CARDS = [
  {
    title: "강아지 파양",
    englishLabel: "Dog Surrender",
    description: "가정견 파양 입소 — 이민·이사·군입대·건강 등 사유별 맞춤 상담.",
  },
  {
    title: "고양이 파양",
    englishLabel: "Cat Surrender",
    description: "가정묘 파양 입소 — 다묘 가정·알러지·환경 변화 등 상황별 안내.",
  },
  {
    title: "강아지 무료분양",
    englishLabel: "Free Dog Adoption",
    description: "입소 아이 중 새 가족을 기다리는 강아지 무료분양·무료입양 매칭.",
  },
  {
    title: "고양이 무료분양",
    englishLabel: "Free Cat Adoption",
    description: "성향·생활 환경을 고려한 고양이 무료분양·입양 상담.",
  },
  {
    title: "입소 케어",
    englishLabel: "Intake Care",
    description: "건강검진·목욕·산책·미용 등 아이 중심의 전문 케어 프로그램.",
  },
  {
    title: "장기 위탁",
    englishLabel: "Long-term Care",
    description: "노령견·노령묘 등 장기 입소 위탁 케어를 책임지고 진행합니다.",
  },
  {
    title: "긴급 입소",
    englishLabel: "Urgent Intake",
    description: "이사·출국 등 급한 상황의 파양 입소도 신속하게 상담·안내합니다.",
  },
  {
    title: "입소 비용 안내",
    englishLabel: "Intake Fee Guide",
    description: "항목별 입소 비용을 투명하게 안내합니다. 현실적인 관리비만 받습니다.",
  },
  {
    title: "무료 상담",
    englishLabel: "Free Consultation",
    description: "전화·온라인으로 파양·무료분양·입양 상담을 받으실 수 있습니다.",
  },
];

const GUIDE_ITEMS = [
  {
    title: "파양·입소 절차 안내",
    subtitle: "Intake Process Guide",
    description:
      "상담부터 센터 방문, 입소 비용 확인, 건강검진·케어, 분양·입양 매칭까지 안내합니다.",
  },
  {
    title: "입소 비용 안내",
    subtitle: "Intake Fee Guide",
    description:
      "모든 사설 보호소에는 관리 비용이 발생합니다. 항목별 입소 비용을 투명하게 안내합니다.",
  },
  {
    title: "무료분양·입양 안내",
    subtitle: "Adoption Guide",
    description:
      "파양견·파양묘의 무료분양·무료입양 절차. 신원 확인과 심층 상담 후 매칭합니다.",
  },
  {
    title: "이럴 때 파양·분양",
    subtitle: "When to Visit",
    description:
      "이민, 이사, 군입대, 임신·출산, 알러지 등 더 이상 함께하기 어려울 때 상담하세요.",
  },
];

const FAQ_POOL = [
  {
    question: "입소 비용은 어떻게 되나요?",
    answer:
      "모든 사설 보호소에는 관리 비용이 발생합니다. 입소 전 항목별 비용을 투명하게 안내하며, 현실적인 관리비만 받습니다.",
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
  {
    question: "입양 후에도 상담을 받을 수 있나요?",
    answer:
      "분양·입양 이후에도 아이의 적응 상태를 확인합니다. 사후 상담을 지원합니다.",
  },
];

const REGION_POOL = [
  "서울", "부천", "인천", "수원", "성남", "안양", "고양", "용인",
  "화성", "김포", "의정부", "광명", "시흥", "안산", "평택", "하남",
];

export function pickDesignDExtras(
  rng: Rng,
  region: string,
  siteName: string,
  firstKeyword: string,
  maxImages: number,
  casesItems: NonNullable<TenantContentData["casesItems"]>
): Partial<TenantContentData> {
  const imagePool = shuffle(
    Array.from({ length: maxImages }, (_, i) => i + 1),
    rng
  );
  const responseMin = randomResponseMinutes(rng);

  const serviceCards = SERVICE_CARDS.map((item, i) => ({
    ...item,
    imageIndex: imagePool[i % imagePool.length],
  }));

  const aboutFeatures = ABOUT_BULLETS.map((text, i) => ({
    icon: ["✓", "✓", "✓", "✓"][i],
    title: text.split(" ")[0] + "…",
    description: text,
  }));

  const regionLinks = [
    `${region}강아지파양`,
    ...shuffle(REGION_POOL.filter((r) => r !== region), rng)
      .slice(0, 11)
      .map((r) => `${r}강아지파양`),
  ];

  return {
    heroEyebrow: pickOne(HERO_EYEBROWS, rng),
    heroKeyword: firstKeyword || `${region}강아지파양`,
    heroSubline: `프리미엄 파양·무료분양 전문 센터`,
    aboutFeatures,
    serviceCards,
    guideItems: GUIDE_ITEMS,
    businessAreas: serviceCards.slice(0, 4).map((c) => ({
      title: c.title,
      description: c.description,
      tags: [c.englishLabel],
      imageIndex: c.imageIndex,
    })),
    faqItems: shuffle(FAQ_POOL, rng).slice(0, 6),
    casesItems: casesItems.slice(0, 12),
    regionLinks,
    trustBadges: ["파양·분양 전문", "투명 입소", "책임 매칭", "365일 상담"],
    stats: [
      { label: "분양·입양 매칭", value: "3,200", suffix: "+" },
      { label: "새 가족을 만난 아이", value: "2,850", suffix: "+" },
      { label: "입소 만족도", value: "97", suffix: "%" },
      { label: "평균 응답 시간", value: String(responseMin), suffix: "분" },
    ],
  };
}
