import { extractRegionFromKeyword } from "@/lib/region-parse";

export interface SeoGeoMeta {
  /** ISO 3166-2 유사 코드 (KR-11 서울 등) */
  region: string;
  placename: string;
  position: string;
  lat: number;
  lng: number;
}

/** 주요 도시·구 대표 좌표 (키워드 geo SEO용) */
const REGION_GEO: Record<string, { region: string; lat: number; lng: number }> = {
  서울: { region: "KR-11", lat: 37.5665, lng: 126.978 },
  강남: { region: "KR-11", lat: 37.4979, lng: 127.0276 },
  강남구: { region: "KR-11", lat: 37.5172, lng: 127.0473 },
  서초: { region: "KR-11", lat: 37.4837, lng: 127.0324 },
  서초구: { region: "KR-11", lat: 37.4837, lng: 127.0324 },
  송파: { region: "KR-11", lat: 37.5145, lng: 127.106 },
  송파구: { region: "KR-11", lat: 37.5145, lng: 127.106 },
  마포: { region: "KR-11", lat: 37.5663, lng: 126.9019 },
  마포구: { region: "KR-11", lat: 37.5663, lng: 126.9019 },
  용산: { region: "KR-11", lat: 37.5326, lng: 126.990 },
  용산구: { region: "KR-11", lat: 37.5326, lng: 126.990 },
  성수: { region: "KR-11", lat: 37.5446, lng: 127.0557 },
  성수동: { region: "KR-11", lat: 37.5446, lng: 127.0557 },
  부산: { region: "KR-26", lat: 35.1796, lng: 129.0756 },
  해운대: { region: "KR-26", lat: 35.1631, lng: 129.1635 },
  대구: { region: "KR-27", lat: 35.8714, lng: 128.6014 },
  수성: { region: "KR-27", lat: 35.8583, lng: 128.6306 },
  인천: { region: "KR-28", lat: 37.4563, lng: 126.7052 },
  송도: { region: "KR-28", lat: 37.3834, lng: 126.643 },
  광주: { region: "KR-29", lat: 35.1595, lng: 126.8526 },
  대전: { region: "KR-30", lat: 36.3504, lng: 127.3845 },
  유성: { region: "KR-30", lat: 36.3624, lng: 127.3565 },
  울산: { region: "KR-31", lat: 35.5384, lng: 129.3114 },
  세종: { region: "KR-50", lat: 36.4801, lng: 127.289 },
  경기: { region: "KR-41", lat: 37.4138, lng: 127.5183 },
  수원: { region: "KR-41", lat: 37.2636, lng: 127.0286 },
  성남: { region: "KR-41", lat: 37.4201, lng: 127.1267 },
  분당: { region: "KR-41", lat: 37.3827, lng: 127.1189 },
  용인: { region: "KR-41", lat: 37.2411, lng: 127.1776 },
  고양: { region: "KR-41", lat: 37.6584, lng: 126.832 },
  일산: { region: "KR-41", lat: 37.658, lng: 126.768 },
  부천: { region: "KR-41", lat: 37.5034, lng: 126.766 },
  안양: { region: "KR-41", lat: 37.3943, lng: 126.9568 },
  안산: { region: "KR-41", lat: 37.3219, lng: 126.8309 },
  화성: { region: "KR-41", lat: 37.1995, lng: 126.8312 },
  김포: { region: "KR-41", lat: 37.6153, lng: 126.7155 },
  파주: { region: "KR-41", lat: 37.7599, lng: 126.780 },
  하남: { region: "KR-41", lat: 37.5393, lng: 127.2149 },
  강원: { region: "KR-42", lat: 37.8228, lng: 128.1555 },
  춘천: { region: "KR-42", lat: 37.8813, lng: 127.73 },
  원주: { region: "KR-42", lat: 37.3422, lng: 127.9202 },
  충북: { region: "KR-43", lat: 36.6357, lng: 127.4912 },
  청주: { region: "KR-43", lat: 36.6424, lng: 127.489 },
  충남: { region: "KR-44", lat: 36.5184, lng: 126.8 },
  천안: { region: "KR-44", lat: 36.8151, lng: 127.1139 },
  전북: { region: "KR-45", lat: 35.7175, lng: 127.153 },
  전주: { region: "KR-45", lat: 35.8242, lng: 127.148 },
  전남: { region: "KR-46", lat: 34.8679, lng: 126.991 },
  여수: { region: "KR-46", lat: 34.7604, lng: 127.6622 },
  순천: { region: "KR-46", lat: 34.9506, lng: 127.4872 },
  경북: { region: "KR-47", lat: 36.4919, lng: 128.8889 },
  포항: { region: "KR-47", lat: 36.019, lng: 129.3435 },
  경남: { region: "KR-48", lat: 35.4606, lng: 128.2132 },
  창원: { region: "KR-48", lat: 35.228, lng: 128.6811 },
  김해: { region: "KR-48", lat: 35.2285, lng: 128.889 },
  제주: { region: "KR-49", lat: 33.4996, lng: 126.5312 },
  제주시: { region: "KR-49", lat: 33.4996, lng: 126.5312 },
  서귀포: { region: "KR-49", lat: 33.2541, lng: 126.5601 },
  서귀포시: { region: "KR-49", lat: 33.2541, lng: 126.5601 },
  중문: { region: "KR-49", lat: 33.2506, lng: 126.412 },
  성산: { region: "KR-49", lat: 33.462, lng: 126.936 },
  애월: { region: "KR-49", lat: 33.464, lng: 126.318 },
};

const DEFAULT_GEO = { region: "KR-11", lat: 37.5665, lng: 126.978, placename: "대한민국" };

function lookupGeo(placename: string) {
  if (REGION_GEO[placename]) return REGION_GEO[placename];
  // 부분 매칭 (예: 강남구청 → 강남구)
  const keys = Object.keys(REGION_GEO).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (placename.includes(key) || key.includes(placename)) {
      return REGION_GEO[key];
    }
  }
  return null;
}

/** 키워드에서 지역을 추출해 geo.region / placename / position 완성 */
export function resolveSeoGeoFromKeyword(keyword: string): SeoGeoMeta {
  const placename = extractRegionFromKeyword(keyword)?.trim() || DEFAULT_GEO.placename;
  const hit = lookupGeo(placename) || DEFAULT_GEO;
  return {
    region: hit.region,
    placename,
    lat: hit.lat,
    lng: hit.lng,
    position: `${hit.lat};${hit.lng}`,
  };
}

export function buildGuideSeoKeywords(exactKeyword: string, brandName: string): string[] {
  const region = extractRegionFromKeyword(exactKeyword);
  const base = [
    exactKeyword,
    brandName,
    "꼬똥드툴레아",
    "메종드꼬똥",
    "Coton de Tulear",
    "Maison de Coton",
    "꼬똥드툴레아 분양",
    "프리미엄 반려견",
  ];
  if (region) {
    base.push(
      `${region} 꼬똥드툴레아`,
      `${region} 꼬똥분양`,
      `${region} 반려견분양`
    );
  }
  return [...new Set(base.filter(Boolean))];
}
