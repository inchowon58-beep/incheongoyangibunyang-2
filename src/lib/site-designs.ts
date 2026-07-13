/** 사이트 생성 시 선택하는 상위 디자인 템플릿 */
export const SITE_DESIGN_OPTIONS = [
  {
    id: "a",
    label: "A 디자인",
    description: "기본 레이아웃 · 좌측 히어로 · 랜덤 섹션·헤더 변형",
  },
  {
    id: "b",
    label: "B 디자인",
    description: "cleneo 스타일 · 상단 띠배너 · 센터 히어로 · 서비스·FAQ·입소비용",
  },
  {
    id: "c",
    label: "C 디자인",
    description: "아가펫 스타일 · 에디토리얼 히어로 · 크림 톤 · 약속·스토리·보호사례",
  },
  {
    id: "d",
    label: "D 디자인",
    description: "mainecoon 스타일 · 프리미엄 히어로 · 서비스·가이드·갤러리·FAQ",
  },
  {
    id: "e",
    label: "E 디자인",
    description: "부동산 전용 · 신뢰형 소개 · 수상·대표소개·후기 · 전화·플레이스 바",
  },
  {
    id: "m",
    label: "M 디자인 · 메종드폼스키",
    description: "폼스키 럭셔리 · 소프트 라운드 · 품종소개·후기·카톡·전화",
  },
] as const;

export type SiteDesignId = (typeof SITE_DESIGN_OPTIONS)[number]["id"];

export const DEFAULT_SITE_DESIGN: SiteDesignId = "m";

const DESIGN_IDS = new Set<string>(SITE_DESIGN_OPTIONS.map((o) => o.id));

export function parseSiteDesignId(value: unknown): SiteDesignId {
  const id = String(value || "").toLowerCase();
  return DESIGN_IDS.has(id) ? (id as SiteDesignId) : DEFAULT_SITE_DESIGN;
}

export function siteDesignLabel(id: SiteDesignId | string | null | undefined): string {
  const found = SITE_DESIGN_OPTIONS.find((o) => o.id === id);
  return found?.label ?? "M 디자인 · 메종드폼스키";
}
