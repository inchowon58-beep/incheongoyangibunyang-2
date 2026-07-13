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

/** 본문 순수 텍스트 목표 — 약 1500자 */
const MIN_BODY_CHARS = 1400;
const MAX_BODY_CHARS = 1600;

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

const CONTENT_RULES = `
작성 조건:
- 전달된 키워드를 중심으로 한 **품종·분양 안내 문서**로 작성 (메인 홈페이지 소개글처럼 쓰지 말 것)
- 키워드는 **전달받은 문자열 그대로** 사용 (글자 사이 띄어쓰기·줄바꿈으로 쪼개지 말 것)
- 키워드를 자연스럽게 본문 전체에 5~7회 포함
- 업체명·전화번호·주소는 반드시 {{brandName}}, {{phone}}, {{address}} 등 토큰으로만 표기 (직접 입력 금지)
- 꼬똥드툴레아(Coton de Tuléar) 품종 소개·분양·케어·성격·털관리 관점으로 작성
- 메종드꼬똥(Maison de Coton)의 프리미엄·럭셔리·포근한 톤 유지. 영문 소제목·핵심 표현을 자연스럽게 함께 사용
- **금지 단어(제목·본문·FAQ·설명에 절대 사용 금지)**: SEO, 검색최적화, 최적화, 인덱싱, 키워드문서, 노출최적화, 콘텐츠최적화
- 허위·과장·확정 수익 보장·과장 건강 효능 표현 금지
- 신뢰감 있는 프리미엄 상담 톤
- h2, h3, p, ul 태그만 사용 (img 태그 직접 사용 금지)
- 본문 순수 텍스트(HTML 태그 제외) **반드시 ${MIN_BODY_CHARS}~${MAX_BODY_CHARS}자** (목표 약 1500자)
- h2 소제목 **정확히 4개**. 각 소제목마다 p 문단 2개 이상 작성 (한 문단만 쓰지 말 것)
- h2는 한국어 + 짧은 영문 병기 권장 (예: 품종의 역사 Heritage)
- 이미지는 시스템에서 본문에 자동 삽입되므로 img·플레이스홀더 사용 금지
- 다른 안내 페이지와 문장·사례·섹션 제목·구성이 겹치지 않게 작성 (매번 새로 쓸 것)
- 자주 묻는 질문(FAQ) **정확히 2개**: 키워드와 관련된 실질적 질문·답변 (답변 2문장 내외, 토큰 사용)
- 제목: 지역명 반복 금지, 상호명·| 구분자 금지 (시스템이 상호 추가)
- 제목: 「최적화」「SEO」 등 내부 용어 금지. 다른 페이지와 같은 패턴·문장 구조 금지
`;

const WRITING_ANGLES = [
  "꼬똥드툴레아 품종 역사와 왕실 유산을 중심으로",
  "코트·털빠짐·미용 케어를 중심으로",
  "크기·성격·실내 반려 적합성을 중심으로",
  "분양 전 체크포인트와 상담 절차를 중심으로",
  "가정 환경 매칭과 사회화를 중심으로",
  "프리미엄 분양 후 애프터케어를 중심으로",
];

const TITLE_STYLE_HINTS = [
  "품종 가이드형",
  "케어 안내형",
  "분양 전 체크리스트형",
  "성격·기질 비교형",
  "실내견 라이프스타일형",
  "럭셔리 컴패니언 안내형",
  "초보 반려인 친절 안내형",
  "지역 특화 분양 인사이트형",
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

  const prompt = `당신은 꼬똥드툴레아(Coton de Tuléar) 프리미엄 분양·품종 안내 전문 작가입니다. 독자가 읽기 좋은 **키워드 중심 안내 문서**를 한국어 HTML로 작성하세요. 영문 핵심어를 소제목·문장에 자연스럽게 섞어 럭셔리한 Maison de Coton 톤을 유지하세요. 제목·본문에 SEO·최적화 같은 내부 용어는 절대 쓰지 마세요.

브랜드 정보 (본문에 토큰 그대로 사용):
- 상호: {{brandName}} ({{companyName}})
- 대표: {{representative}}
- 연락처: {{phone}}
- 주소: {{address}}
${tenantContextBlock}
키워드: "${corePhrase}"
※ 키워드는 띄어쓰기 없이 위 문자열 그대로만 사용
${region ? `지역 맥락: ${region}` : ""}
제목 스타일: ${titleStyleHint}
작성 관점: ${angle}
고유 시드: ${uniqueSeed}

필수: content 순수 텍스트(태그 제외)가 ${MIN_BODY_CHARS}자 이상 ${MAX_BODY_CHARS}자 이하가 되도록 쓰세요. 목표 약 1500자. 짧으면 실패입니다.
${CONTENT_RULES}

JSON만 응답:
{
  "title": "55자 이내 안내 제목 (SEO·최적화 단어 금지)",
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
        answer: `카톡 또는 전화 {{phone}}로 희망 일정·가정 환경을 알려주시면 {{brandName}}에서 ${regionNote}꼬똥드툴레아 기질·케어 포인트를 안내합니다.`,
      },
      {
        question: `${keyword} 분양 전 꼭 확인할 점은?`,
        answer: `털관리 주기, 실내 활동량, 사회화 계획을 미리 점검하는 것이 중요합니다. {{brandName}}은 분양 전 체크리스트로 안내하며, 문의는 {{phone}}로 가능합니다.`,
      },
    ],
    [
      {
        question: `${regionNote}${keyword} 털빠짐은 심한 편인가요?`,
        answer: `꼬똥드툴레아는 상대적으로 털이 덜 떨어지는 편이나, 엉김 방지를 위한 정기 빗질·미용이 필요합니다. {{brandName}}에서 케어 루틴을 함께 안내합니다.`,
      },
      {
        question: `첫 반려견인데도 분양이 가능한가요?`,
        answer: `가능합니다. 성격·크기·일상 케어를 차근히 설명해 드립니다. {{phone}}로 상황을 알려주시면 {{brandName}}이 맞는 아이를 상담합니다.`,
      },
    ],
    [
      {
        question: `${keyword} 관련 개체는 어떻게 매칭하나요?`,
        answer: `가정 환경·생활 패턴·선호 기질을 먼저 정리한 뒤 후보를 비교합니다. {{brandName}} 상담에서 우선순위를 함께 정해 드립니다.`,
      },
      {
        question: `방문·화상 상담은 예약이 필요한가요?`,
        answer: `원활한 안내를 위해 사전 연락을 권장합니다. {{phone}} 또는 카톡으로 일정을 잡아 주세요.`,
      },
    ],
  ];

  return faqSets[hashKeyword(keyword) % faqSets.length];
}

type FallbackBuilder = (keyword: string, region: string | null) => string;

/** API 키 없을 때만 사용 — 본문 약 1500자 분량 */
const FALLBACK_VARIANTS: FallbackBuilder[] = [
  (keyword, region) => {
    const core = buildSeoCorePhrase(keyword);
    const area = region || "전국";
    return `
<h2>${core} 기본 이해 Heritage</h2>
<p>{{brandName}}은 ${area}를 비롯한 문의에 대해 ${core} 상담을 진행합니다. 꼬똥드툴레아(Coton de Tuléar)는 솜처럼 부드러운 코트와 사람을 향한 온화한 성격으로 프리미엄 컴패니언으로 사랑받아 온 품종입니다. 키워드로 찾는 정보는 외모뿐 아니라 기질·케어·가정 적합성까지 함께 보는 편이 안전합니다.</p>
<p>{{brandName}}은 과장된 확정 표현 없이 확인 가능한 품종 특성과 분양 전 체크리스트를 중심으로 안내하며, 문의는 {{phone}}로 가능합니다. Maison de Coton의 철학은 품격을 지키며 가정에 맞는 인연을 잇는 것입니다.</p>

<h2>${keyword} 상담 전 준비 Care Checklist</h2>
<p>${keyword} 상담을 효율적으로 받으려면 가정 환경, 하루 돌봄 가능 시간, 미용·빗질 주기를 미리 메모해 두는 것이 좋습니다. 첫 반려견이라면 사회화와 기본 예절 훈련 계획까지 함께 조율합니다.</p>
<ul>
<li>가정 구성원과 생활 패턴</li>
<li>실내 활동·산책 가능 여부</li>
<li>코트 관리·미용 주기</li>
<li>분양 후 궁금한 케어 포인트</li>
</ul>
<p>준비가 정리되면 기질 매칭이 빨라지고, 불필요한 재상담을 줄일 수 있습니다. {{brandName}}은 우선순위를 함께 정해 드립니다.</p>

<h2>${area} 라이프스타일과 매칭 Lifestyle</h2>
<p>${area} 생활권에서도 꼬똥드툴레아는 비교적 조용한 실내견으로 잘 어울립니다. ${keyword}를 볼 때는 단순 외모보다 애착 성향, 분리불안 대비, 정기 미용 부담을 함께 점검하는 것이 좋습니다.</p>
<p>{{brandName}}은 품종 지식을 바탕으로 후보를 비교·정리합니다. 연락은 {{phone}}이며, 카톡 상담도 가능합니다.</p>

<h2>${keyword} 다음 단계 Private Inquiry</h2>
<p>관심 조건이 정리되면 {{phone}}로 연락해 주세요. 상담부터 분양 안내까지 {{companyName}} {{brandName}}이 단계별로 도와드립니다. ${keyword} 관련 궁금한 점은 언제든 문의해 주시면 됩니다.</p>
<p>케어 루틴·성격 매칭·입양 후 조언까지 상담 단계에서 투명하게 설명드리며, 가정에 맞는 Soft Companion을 신중히 소개합니다.</p>`.trim();
  },
  (keyword, region) => {
    const area = region || "국내";
    return `
<h2>${keyword} 검색자가 자주 묻는 핵심 Guide</h2>
<p>${keyword}로 찾는 분들은 보통 크기·털빠짐·성격·분양 절차를 동시에 확인하려 합니다. {{brandName}}은 목적에 맞게 정보를 나누어 설명하고, 확인이 필요한 항목을 순서대로 정리합니다.</p>
<p>과장된 확정 표현 없이 품종 사실과 케어 절차 중심으로 안내합니다. 문의는 {{phone}}입니다. 첫 상담에서 생활 패턴만 명확해도 이후 매칭이 훨씬 수월해집니다.</p>

<h2>분양 전 체크리스트 Before Adoption</h2>
<p>분양 전에 코트 관리와 사회화를 점검하지 않으면 입양 후 부담이 커질 수 있습니다. ${keyword}라도 기본 체크는 동일하게 적용됩니다.</p>
<ul>
<li>털관리·미용 주기 이해</li>
<li>실내 활동량과 분리 시간</li>
<li>가족·아이와의 사회화</li>
<li>분양 후 문의 채널 확인</li>
</ul>
<p>체크리스트를 기준으로 진행하면 적응이 안정적입니다. {{brandName}}이 단계별로 안내해 드립니다.</p>

<h2>${area}에서의 상담 진행 Consultation</h2>
<p>${area}에서도 전화·카톡으로 일정 조율이 가능합니다. 원거리에 계시더라도 사진·기질 설명·케어 가이드를 공유하며 진행할 수 있습니다. ${keyword} 조건을 바탕으로 후보를 좁힌 뒤 상담 일정을 잡는 방식을 권합니다.</p>
<p>{{brandName}} Maison de Coton은 프리미엄 품종의 책임을 중시하며, 대표 {{representative}} 상담을 통해 맞춰 드립니다.</p>

<h2>상담 연결 Contact</h2>
<p>${keyword} 관련 궁금한 점이 있으면 {{phone}}로 문의해 주세요. {{brandName}}이 다음 단계(상담·매칭·애프터케어)를 함께 정리합니다.</p>
<p>크기, 성격, 털빠짐, 케어까지 한 번에 물어보셔도 됩니다. 목적에 맞는 선택지를 투명하게 안내하겠습니다.</p>`.trim();
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
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 품종 가이드`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} 케어 안내`),
    (k: string, r: string | null) =>
      generateVariedSeoTitle(k, r, `${extractServicePhrase(k, r)} — Soft Guide`),
  ];
  const descVariants = [
    (k: string) =>
      `${buildSeoCorePhrase(k)} 안내. {{brandName}}에서 꼬똥드툴레아 프리미엄 상담을 진행합니다.`,
    (k: string, r: string | null) =>
      `${r ? `${r} ` : ""}${extractServicePhrase(k, r)} 케어·분양 가이드. {{brandName}} · {{phone}}.`,
    (k: string) =>
      `{{brandName}} ${buildSeoCorePhrase(k)} — 품종·케어·상담. 전화 {{phone}}.`,
    (k: string) =>
      `${buildSeoCorePhrase(k)} 관련 자주 묻는 내용 정리. {{brandName}} Maison de Coton.`,
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
