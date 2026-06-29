export const siteUrl = "https://incheongoyangibunyang-2.vercel.app";

export const targetKeywords = ['인천고양이분양', '인천 고양이 분양', '인천 아기고양이', '건강한 고양이 분양', '고양이 분양 전문 인천'] as const;

export const siteTitle = "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요";

export const siteDescription =
  "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.";

export function getStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "인천고양이분양",
        description: siteDescription,
        inLanguage: "ko-KR",
        telephone: "0505-464-1004",
        knowsAbout: [...targetKeywords],
      },
    ],
  };
}
