/** 발행 키워드 노출 건강검진 — 순위 + 추정 검색량 기반 분류 */

export type HealthStatus = "success" | "opportunity" | "watch";

export interface KeywordHealthRow {
  pageId: string;
  keyword: string;
  slug: string;
  rank: number | null;
  /** 추정 월간 검색량 (실제 Ad API 연동 전 휴리스틱) */
  monthlyVolume: number;
  volumeEstimated: boolean;
  status: HealthStatus;
  statusLabel: string;
  prescription: string;
  checkedAt: string | null;
}

/** 1페이지 = 1~10위, 2페이지 = 11~20, 3페이지 이하 = 21+ */
const PAGE1_MAX = 10;
const PAGE2_MAX = 20;
/** 이 추정 검색량 이상인데 노출 약하면 기회(빨간불) */
const OPPORTUNITY_VOLUME_MIN = 800;

const COMMERCIAL_BOOST: { pattern: RegExp; boost: number }[] = [
  { pattern: /분양|입양|무료분양|무료입양/, boost: 2200 },
  { pattern: /가격|비용|견적|상담/, boost: 1600 },
  { pattern: /추천|후기|비교|순위/, boost: 1200 },
  { pattern: /케어|관리|미용|훈련/, boost: 900 },
  { pattern: /새끼|분양가|분양문의/, boost: 1800 },
];

const REGION_HINT =
  /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|수원|성남|고양|용인|부천|안산|안양|남양주|화성|평택|의정부|시흥|파주|김포|광명|군포|하남|오산|이천|안성|의왕|양평|가평|포천|동두천|구리|과천|연천|강남|송파|마포|용산|성동|광진|서초|영등포|노원|강서|양천|구로|금천|관악|동작|중랑|도봉|강북|성북|동대문|종로|중구|은평|서대문|해운대|수영|남구|북구|동구|서구|연수|남동|부평|계양|미추홀|강화|옹진/;

function hashKeyword(keyword: string): number {
  let h = 2166136261;
  for (let i = 0; i < keyword.length; i++) {
    h ^= keyword.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * 네이버 검색광고 API 연동 전용 추정값.
 * 키워드 의도·지역·길이를 반영한 결정적 수치(같은 키워드는 항상 동일).
 */
export function estimateMonthlyVolume(keyword: string): number {
  const k = keyword.trim();
  if (!k) return 0;

  const h = hashKeyword(k);
  let base = 400 + (h % 2600);

  for (const { pattern, boost } of COMMERCIAL_BOOST) {
    if (pattern.test(k)) base += boost;
  }
  if (REGION_HINT.test(k)) base += 700;
  if (k.length <= 6) base += 500;
  if (k.length >= 14) base = Math.round(base * 0.72);

  // 보기 좋게 50 단위 반올림
  return Math.max(100, Math.round(base / 50) * 50);
}

export function classifyKeywordHealth(
  rank: number | null,
  monthlyVolume: number
): { status: HealthStatus; statusLabel: string; prescription: string } {
  const onPage1 = rank !== null && rank <= PAGE1_MAX;
  const onPage2 = rank !== null && rank > PAGE1_MAX && rank <= PAGE2_MAX;
  const weakOrMissing = rank === null || rank > PAGE2_MAX;
  const highVolume = monthlyVolume >= OPPORTUNITY_VOLUME_MIN;

  if (onPage1) {
    return {
      status: "success",
      statusLabel: "노출 완료",
      prescription: "현재 1페이지 노출 중입니다. 순위 유지만 점검하면 됩니다.",
    };
  }

  if (weakOrMissing && highVolume) {
    const where =
      rank === null ? "현재 누락(상위 100위 밖)" : `현재 ${Math.ceil(rank / 10)}페이지·${rank}위`;
    return {
      status: "opportunity",
      statusLabel: "기회 · 보강 필요",
      prescription: `${where}. 검색량이 아까우니 본문을 1,500자 이상으로 보강해 재발행하세요.`,
    };
  }

  if (onPage2) {
    return {
      status: "watch",
      statusLabel: "2페이지 노출",
      prescription: "1페이지 진입을 위해 내용·내부링크 보강을 권장합니다.",
    };
  }

  return {
    status: "opportunity",
    statusLabel: "노출 약함",
    prescription:
      rank === null
        ? "상위권에 보이지 않습니다. 재포스팅으로 본문을 보강하세요."
        : `현재 ${rank}위입니다. 재포스팅으로 상위 노출을 노려보세요.`,
  };
}

export function formatVolume(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function formatRankDisplay(rank: number | null): string {
  if (rank === null) return "누락 (100위 밖)";
  const page = Math.ceil(rank / 10);
  return `${rank}위 · ${page}페이지`;
}
