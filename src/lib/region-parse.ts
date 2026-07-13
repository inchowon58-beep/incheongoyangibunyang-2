/** 키워드에서 지역명 추출 (예: 의정부철거업체 → 의정부, 은평구철거지원금 → 은평구) */
export const SERVICE_SUFFIXES = [
  "인테리어철거업체",
  "인테리어철거",
  "상가철거업체",
  "상가철거",
  "폐업철거업체",
  "폐업철거",
  "철거지원금",
  "폐업지원금",
  "철거업체",
  "철거",
  "원상복구",
  "폐업",
  "지원금",
  "업체",
  "부동산중개",
  "공인중개사",
  "부동산",
  "중개사",
  "중개",
  "강아지무료분양",
  "고양이무료분양",
  "강아지파양",
  "고양이파양",
  "폼스키분양",
  "폼스키",
  "포메허스키",
  "무료분양",
  "무료입양",
  "파양",
  "분양",
  "입양",
];

const SEOUL_GU = [
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
  "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
  "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
];

const KNOWN_REGIONS = [
  ...SEOUL_GU,
  "의정부", "강남", "서초", "송파", "마포", "영등포", "용산", "종로", "동대문",
  "성북", "강북", "노원", "도봉", "은평", "서대문", "강서", "양천", "구로", "금천",
  "관악", "동작", "광진", "성동", "강동", "일산", "파주", "김포", "고양", "부천",
  "인천", "수원", "용인", "성남", "안양", "안산", "화성", "평택", "시흥", "광명",
  "부산", "대구", "광주", "대전", "울산", "세종", "창원", "천안", "청주", "전주",
  "제주", "서귀포", "서귀포시", "제주시", "중문", "성산", "애월", "한림",
  "춘천", "원주", "포항", "구미", "김해", "진주", "순천", "목포", "여수",
  "자양동", "성수동", "군자동", "면목동", "삼성동", "잠실", "송파동", "문정동",
  "가락동", "천호동", "구의동", "광나루", "화양동", "능동", "자곡동", "세곡동",
  "삼전동", "역삼동", "논현동", "신사동", "압구정", "대치동", "개포동",
  "상봉리", "하남", "미사", "강일동", "중랑", "망우동", "신내동",
];

export { KNOWN_REGIONS };

const SORTED_REGIONS = [...KNOWN_REGIONS].sort((a, b) => b.length - a.length);

/** 키워드 앞부분 행정구역 (은평구, 강동구, 자양동 등) */
function matchRegionPrefix(normalized: string): string | null {
  for (const region of SORTED_REGIONS) {
    if (normalized.startsWith(region)) return region;
  }

  const auto = normalized.match(/^([가-힣]{2,8}(?:구|시|군|동|읍|면|리))/);
  if (auto?.[1]) return auto[1];

  return null;
}

export function extractRegionFromKeyword(keyword: string): string | null {
  const normalized = keyword.replace(/\s+/g, "").trim();
  if (!normalized) return null;

  const prefix = matchRegionPrefix(normalized);
  if (prefix) return prefix;

  let text = normalized;
  const sorted = [...SERVICE_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    if (text.endsWith(suffix)) {
      text = text.slice(0, -suffix.length);
      break;
    }
  }

  text = text.trim();
  if (text.length < 2 || text.length > 10) return null;
  return text;
}
