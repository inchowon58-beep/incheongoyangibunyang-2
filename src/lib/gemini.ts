import type { SiteConfig } from "./site-config-types";
import type { SeoFaq } from "./data";
import {
  buildSeoCorePhrase,
  extractServicePhrase,
  generateVariedSeoTitle,
  normalizeSeoKeyword,
  polishSeoHtmlContent,
  polishSeoText,
  extractRegionForKeyword,
  enforceExactKeyword,
} from "./seo-keyword";
import { stripHtmlToText } from "./seo-reviews";

interface GenerateOptions {
  keyword: string;
  apiKey: string;
  site: SiteConfig;
  siteBrief?: {
    keywords?: string;
    aboutText?: string;
    heroHeadline?: string;
    siteDesign?: string;
  };
}

export interface GeneratedSeoContent {
  title: string;
  description: string;
  content: string;
  slug?: string;
  faqs: SeoFaq[];
}

/** 본문 순수 텍스트 목표 */
const MIN_BODY_CHARS = 1000;
const MAX_BODY_CHARS = 1600;

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

const CONTENT_RULES = `
작성 조건:
- 전달된 키워드를 중심으로 한 **검색 최적화 문서**로 작성 (메인 홈페이지 소개글처럼 쓰지 말 것)
- 키워드는 **전달받은 문자열 그대로** 사용 (글자 사이 띄어쓰기·줄바꿈으로 쪼개지 말 것)
- 키워드를 자연스럽게 본문 전체에 5~7회 포함
- 업체명·전화번호·주소는 반드시 {{brandName}}, {{phone}}, {{address}} 등 토큰으로만 표기 (직접 입력 금지)
- 제주·서귀포 공인중개·부동산 중개·매매·전세·월세·상담 관점으로 작성
- 허위·과장·확정 수익 보장 표현 금지
- 신뢰감 있는 전문가 톤
- h2, h3, p, ul 태그만 사용 (img 태그 직접 사용 금지)
- 본문 순수 텍스트(HTML 태그 제외) **반드시 ${MIN_BODY_CHARS}~${MAX_BODY_CHARS}자**
- h2 소제목 **정확히 4개**. 각 소제목마다 p 문단 2개 이상 작성 (한 문단만 쓰지 말 것)
- 이미지는 시스템에서 본문에 자동 삽입되므로 img·플레이스홀더 사용 금지
- 다른 SEO 페이지와 문장·사례·섹션 제목·구성이 겹치지 않게 작성 (매번 새로 쓸 것)
- 자주 묻는 질문(FAQ) **정확히 2개**: 키워드와 관련된 실질적 질문·답변 (답변 2문장 내외, 토큰 사용)
- 제목: 지역명 반복 금지, 상호명·| 구분자 금지 (시스템이 상호 추가)
- 제목: 다른 페이지와 같은 패턴·문장 구조 금지
`;

const WRITING_ANGLES = [
  "매수·매도 상담 절차와 체크포인트를 중심으로",
  "전세·월세 계약 시 확인해야 할 권리관계를 중심으로",
  "지역 생활권·교통·시세를 이해하는 관점으로",
  "중개 수수료·일정·계약 단계를 투명하게 안내하는 관점으로",
  "이주·원거리 상담·서류 확인을 중심으로",
  "안전한 잔금·인도·사후 문의까지 동행하는 관점으로",
];

const TITLE_STYLE_HINTS = [
  "중개 상담 가이드형",
  "지역 생활권 안내형",
  "계약 전 체크리스트형",
  "매매·임대 비교형",
  "권리관계 확인 강조형",
  "실무 절차 안내형",
  "초보 거래자 친절 안내형",
  "지역 특화 인사이트형",
];

function hashKeyword(keyword: string): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = (hash << 5) - hash + keyword.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickAngle(keyword: string): string {
  return WRITING_ANGLES[hashKeyword(keyword) % WRITING_ANGLES.length];
}

function resolveApiKey(apiKey: string): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    apiKey?.trim() ||
    ""
  );
}

function bodyPlainLength(html: string): number {
  return stripHtmlToText(html).length;
}

export async function generateSeoContent({
  keyword: rawKeyword,
  apiKey,
  site,
  siteBrief,
}: GenerateOptions): Promise<GeneratedSeoContent> {
  const keyword = normalizeSeoKeyword(rawKeyword);
  const key = resolveApiKey(apiKey);

  if (!key) {
    console.warn("[seo] GEMINI_API_KEY 없음 — 폴백 콘텐츠 사용");
    return generateFallbackContent(keyword, site);
  }

  const region = extractRegionForKeyword(keyword);
  const corePhrase = buildSeoCorePhrase(keyword);
  const angle = pickAngle(keyword);
  const uniqueSeed = `${keyword}-${hashKeyword(keyword)}-${Date.now()}`;
  const titleStyleHint =
    TITLE_STYLE_HINTS[hashKeyword(keyword + "style") % TITLE_STYLE_HINTS.length];

  const tenantContextBlock = siteBrief
    ? `
이 사이트 맥락 (다른 브랜드 문구 금지):
- 슬로건: ${site.tagline}
- SEO 키워드: ${siteBrief.keywords?.trim() || "(없음)"}
- 소개: ${(siteBrief.aboutText || site.description).trim().slice(0, 500)}
${siteBrief.heroHeadline ? `- 히어로: ${siteBrief.heroHeadline}` : ""}
- 상호는 {{brandName}}·{{companyName}} 토큰만 사용
`
    : "";

  const prompt = `당신은 제주·서귀포 부동산 공인중개 SEO 전문 작가입니다. 네이버 검색 최적화를 위한 **키워드 문서형** 한국어 HTML을 작성하세요.

사무소 정보 (본문에 토큰 그대로 사용):
- 상호: {{brandName}} ({{companyName}})
- 대표: {{representative}}
- 연락처: {{phone}}
- 주소: {{address}}
${tenantContextBlock}
키워드: "${corePhrase}"
※ 키워드는 띄어쓰기 없이 위 문자열 그대로만 사용 (잘못된 예: "서귀포부동 산")
${region ? `지역 맥락: ${region}` : ""}
제목 스타일: ${titleStyleHint}
작성 관점: ${angle}
고유 시드: ${uniqueSeed}

필수: content 순수 텍스트(태그 제외)가 ${MIN_BODY_CHARS}자 이상 ${MAX_BODY_CHARS}자 이하가 되도록 충분히 길게 쓰세요. 짧으면 실패입니다.
${CONTENT_RULES}

JSON만 응답:
{
  "title": "55자 이내 SEO 제목",
  "description": "150자 이내 메타 설명",
  "slug": "영문-소문자-slug",
  "content": "HTML 본문 (h2 4개, 각 섹션 p 2문단 이상)",
  "faqs": [
    { "question": "질문1", "answer": "답변1" },
    { "question": "질문2", "answer": "답변2" }
  ]
}`;

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);

  const errors: string[] = [];

  for (const modelName of GEMINI_MODELS) {
    for (const useJsonMime of [true, false]) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 1.05,
            topP: 0.95,
            maxOutputTokens: 8192,
            ...(useJsonMime ? { responseMimeType: "application/json" as const } : {}),
          },
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          errors.push(`${modelName}: JSON 파싱 실패`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          title: string;
          description: string;
          content: string;
          slug?: string;
          faqs?: SeoFaq[];
        };

        if (!parsed.content?.trim()) {
          errors.push(`${modelName}: content 비어 있음`);
          continue;
        }

        const plainLen = bodyPlainLength(parsed.content);
        if (plainLen < MIN_BODY_CHARS) {
          errors.push(`${modelName}: 본문 ${plainLen}자 (최소 ${MIN_BODY_CHARS}자)`);
          continue;
        }

        if (plainLen > MAX_BODY_CHARS + 400) {
          console.warn(`[seo] 본문 ${plainLen}자 — 목표 상한 초과, 저장은 진행`);
        }

        console.info(`[seo] Gemini OK model=${modelName} bodyChars=${plainLen}`);

        return {
          title: generateVariedSeoTitle(keyword, region, parsed.title),
          description: polishSeoText(parsed.description, region, keyword),
          content: polishSeoHtmlContent(parsed.content, keyword),
          slug: parsed.slug,
          faqs: normalizeFaqs(parsed.faqs, keyword, site).map((f) => ({
            question: enforceExactKeyword(f.question, keyword),
            answer: enforceExactKeyword(f.answer, keyword),
          })),
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${modelName}${useJsonMime ? "+json" : ""}: ${msg}`);
        console.error(`[seo] Gemini fail ${modelName}:`, msg);
      }
    }
  }

  // API 키가 있는데도 실패하면 짧은 폴백으로 숨기지 않고 에러
  const detail = errors.slice(0, 3).join(" | ");
  throw new Error(
    `Gemini SEO 생성 실패(본문 ${MIN_BODY_CHARS}자 미달 또는 API 오류). ${detail}`
  );
}

function normalizeFaqs(
  faqs: SeoFaq[] | undefined,
  keyword: string,
  site: SiteConfig
): SeoFaq[] {
  const valid = (faqs || []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (valid.length >= 2) return valid.slice(0, 2);
  return buildDefaultFaqs(keyword, site);
}

export function buildDefaultFaqs(keyword: string, site: SiteConfig): SeoFaq[] {
  const region = extractRegionForKeyword(keyword);
  const regionNote = region ? `${region} ` : "";

  const faqSets: SeoFaq[][] = [
    [
      {
        question: `${keyword} 상담은 어떻게 진행되나요?`,
        answer: `전화 {{phone}} 또는 방문 상담으로 목적(매매·전세·월세)을 확인한 뒤 일정과 확인 서류를 안내합니다. {{brandName}}에서 ${regionNote}관련 조건을 함께 정리해 드립니다.`,
      },
      {
        question: `${keyword} 계약 전 꼭 확인할 점은?`,
        answer: `권리관계·등기·잔금 일정·특약 사항을 미리 점검하는 것이 중요합니다. {{brandName}}은 계약 전 체크리스트를 바탕으로 안내하며, 궁금한 점은 {{phone}}로 문의하세요.`,
      },
    ],
    [
      {
        question: `${regionNote}${keyword} 중개 수수료는 어떻게 되나요?`,
        answer: `법정 요율 범위에서 거래 유형·금액에 따라 안내합니다. {{brandName}}은 상담 단계에서 예상 비용을 투명하게 설명합니다.`,
      },
      {
        question: `멀리 살아도 상담·계약이 가능한가요?`,
        answer: `가능합니다. 서류·일정·현장 확인을 단계별로 공유하며 진행합니다. {{phone}}로 상황을 알려주시면 {{brandName}}이 동선에 맞춰 안내합니다.`,
      },
    ],
    [
      {
        question: `${keyword} 관련 매물·조건은 어떻게 좁히나요?`,
        answer: `예산·입지·생활권·거래 형태를 먼저 정리한 뒤 후보를 비교합니다. {{brandName}} 상담에서 우선순위를 함께 정해 드립니다.`,
      },
      {
        question: `방문 상담은 예약이 필요한가요?`,
        answer: `원활한 안내를 위해 사전 연락을 권장합니다. {{address}} 인근이며, {{phone}}로 일정을 잡아 주세요.`,
      },
    ],
  ];

  return faqSets[hashKeyword(keyword) % faqSets.length];
}

type FallbackBuilder = (keyword: string, region: string | null) => string;

/** API 키 없을 때만 사용 — 본문 1000자 이상 분량 */
const FALLBACK_VARIANTS: FallbackBuilder[] = [
  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    const area = region || "제주";
    return `
<h2>${core} 기본 이해</h2>
<p>{{brandName}}은 ${area}를 중심으로 ${core} 상담을 진행합니다. 매매·전세·월세 등 목적에 따라 확인해야 할 서류와 일정이 달라지므로, 첫 상담에서 조건을 정리하는 것이 중요합니다. 키워드로 찾는 정보는 시세뿐 아니라 생활권·권리관계까지 함께 보는 편이 안전합니다.</p>
<p>대표 {{representative}}와 함께 계약 전 체크리스트를 바탕으로 안내하며, 문의는 {{phone}}로 가능합니다. 과장된 확정 표현 없이 확인 가능한 사실 중심으로 설명합니다.</p>

<h2>${keyword} 상담 전 준비</h2>
<p>${keyword} 상담을 효율적으로 받으려면 예산 범위, 희망 입지, 입주·잔금 가능 시기를 미리 메모해 두는 것이 좋습니다. 원거리 이주라면 서류 전달 방식과 방문 일정까지 함께 조율합니다.</p>
<ul>
<li>거래 목적과 예산 범위</li>
<li>희망 생활권·교통·편의시설</li>
<li>잔금·입주 가능 시기</li>
<li>확인이 필요한 서류·특약</li>
</ul>
<p>준비가 정리되면 후보 비교가 빨라지고, 불필요한 재방문을 줄일 수 있습니다. {{brandName}}은 우선순위를 함께 정해 드립니다.</p>

<h2>${area} 생활권과 거래 포인트</h2>
<p>${area}는 생활권마다 분위기와 수요가 다릅니다. ${keyword}를 볼 때는 단순 가격표보다 일상 동선, 주차·관리, 주변 상권 변화를 함께 점검하는 것이 좋습니다.</p>
<p>{{brandName}}은 현장 감각을 바탕으로 후보를 비교·정리합니다. 사무소는 {{address}}에 있으며, 방문 전 연락을 권장합니다.</p>

<h2>${keyword} 다음 단계</h2>
<p>관심 조건이 정리되면 {{phone}}로 연락해 주세요. 상담부터 계약 동행까지 {{companyName}} {{brandName}}이 단계별로 안내합니다. ${keyword} 관련 궁금한 점은 언제든 문의해 주시면 됩니다.</p>
<p>중개 수수료·일정·특약 사항도 상담 단계에서 투명하게 설명드리며, 잔금·인도까지 필요한 확인 항목을 함께 챙깁니다.</p>`.trim();
  },
  (keyword, region) => {
    const area = region || "서귀포";
    return `
<h2>${keyword} 검색자가 자주 묻는 핵심</h2>
<p>${keyword}로 찾는 분들은 보통 가격·입지·계약 안정성을 동시에 확인하려 합니다. {{brandName}}은 목적에 맞게 정보를 나누어 설명하고, 확인이 필요한 항목을 순서대로 정리합니다.</p>
<p>과장된 확정 표현 없이 사실과 절차 중심으로 안내합니다. 문의는 {{phone}}입니다. 첫 상담에서 예산과 거래 형태만 명확해도 이후 진행이 훨씬 수월해집니다.</p>

<h2>계약 전 체크리스트</h2>
<p>계약 전에 권리관계와 특약을 점검하지 않으면 잔금 단계에서 문제가 생길 수 있습니다. ${keyword} 거래라도 기본 체크는 동일하게 적용됩니다.</p>
<ul>
<li>등기·권리관계 확인</li>
<li>중개 수수료·일정 안내</li>
<li>특약·인도 조건 정리</li>
<li>잔금 당일 점검 항목</li>
</ul>
<p>체크리스트를 기준으로 진행하면 불필요한 재방문을 줄일 수 있습니다. {{brandName}}이 단계별로 안내해 드립니다.</p>

<h2>${area}에서의 실무 진행</h2>
<p>${area} 거래는 일정 조율과 현장 확인이 중요합니다. 원거리에 계시더라도 사진·서류·일정을 공유하며 진행할 수 있습니다. ${keyword} 조건을 바탕으로 후보를 좁힌 뒤 방문 일정을 잡는 방식을 권합니다.</p>
<p>사무소 주소는 {{address}}이며, 방문 전 연락을 권장합니다. 대표 {{representative}}가 상담을 도와드립니다.</p>

<h2>상담 연결</h2>
<p>${keyword} 관련 궁금한 점이 있으면 {{phone}}로 문의해 주세요. {{brandName}}이 다음 단계(상담·서류·계약)를 함께 정리합니다.</p>
<p>생활권 비교, 수수료 안내, 잔금 일정까지 한 번에 물어보셔도 됩니다. 목적에 맞는 선택지를 투명하게 안내하겠습니다.</p>`.trim();
  },
];

function generateFallbackContent(
  keyword: string,
  site: SiteConfig
): GeneratedSeoContent {
  const region = extractRegionForKeyword(keyword);
  const variantIdx = hashKeyword(keyword) % FALLBACK_VARIANTS.length;
  const content = FALLBACK_VARIANTS[variantIdx](keyword, region);

  const titleVariants = [
    (k: string, r: string | null) => generateVariedSeoTitle(k, r),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 중개 안내`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 상담 가이드`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} — 실무 체크`),
  ];
  const descVariants = [
    (k: string) =>
      `${buildSeoCorePhrase(k)} 안내. {{brandName}}에서 투명한 중개 상담을 진행합니다.`,
    (k: string, r: string | null) =>
      `${r ? `${r} ` : ""}${extractServicePhrase(k, r)} 실무 가이드. {{brandName}} · {{phone}}.`,
    (k: string) =>
      `{{brandName}} ${buildSeoCorePhrase(k)} — 계약 전 체크와 상담. 전화 {{phone}}.`,
    (k: string) =>
      `${buildSeoCorePhrase(k)} 관련 자주 묻는 내용 정리. {{brandName}} 공인중개 상담.`,
  ];

  const tIdx = hashKeyword(keyword + "t") % titleVariants.length;
  const dIdx = hashKeyword(keyword + "d") % descVariants.length;

  return {
    title: titleVariants[tIdx](keyword, region),
    description: polishSeoText(descVariants[dIdx](keyword, region), region, keyword),
    content: polishSeoHtmlContent(content, keyword),
    faqs: buildDefaultFaqs(keyword, site).map((f) => ({
      question: enforceExactKeyword(f.question, keyword),
      answer: enforceExactKeyword(f.answer, keyword),
    })),
  };
}
