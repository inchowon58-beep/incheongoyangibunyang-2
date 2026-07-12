import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getCachedGuideSlugList,
  resolveCachedGuidePage,
} from "@/lib/guide-cache";
import { guidePageUrl } from "@/lib/constants";
import { buildPageMetadata, getOgImageAbsoluteUrl } from "@/lib/metadata";
import { buildDefaultFaqs } from "@/lib/gemini";
import { resolveSeoPage, phoneToTel, getPageImageUrl } from "@/lib/site-config";
import { getSeoContentImageUrls } from "@/lib/seo-content-images";
import { extractRegionFromKeyword } from "@/lib/region-parse";
import { getNearbySubRegionLinks } from "@/lib/nearby-regions";
import { getRelatedKeywordPageLinks } from "@/lib/related-keyword-pages";
import NearbyRegionsSection from "@/components/NearbyRegionsSection";
import RelatedKeywordPagesSection from "@/components/RelatedKeywordPagesSection";
import LocalPartnersSection from "@/components/LocalPartnersSection";
import { showCompanyContact } from "@/lib/exposure-mode";
import Link from "next/link";
import {
  buildSeoBrowserTitle,
  enforceExactKeyword,
  normalizeSeoKeyword,
} from "@/lib/seo-keyword";
import { ensureLocalPartners } from "@/lib/seo-local-partners";
import GuideReviewsSection from "@/components/GuideReviewsSection";
import { getSeoReviewsForKeyword } from "@/lib/seo-reviews";
import { jejuImageUrl, pickJejuImageIndexes } from "@/lib/jeju-images";
import { getResolvedSiteConfig } from "@/utils/siteConfig";

/**
 * SSR + Data Cache (ISR)
 * - 서버에서 글을 조립해 완성 HTML을 로봇에게 제공 (클라이언트 fetch 아님)
 * - 1시간 캐시로 수집 속도·안정성 향상
 * - 생성 직후 revalidateTag로 캐시 무효화
 * - 테넌트 사이트는 Supabase tenant_seo_pages에서 조회
 */
export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

const DEFAULT_GEO = { lat: 33.2559783, lng: 126.5721595 };

export async function generateStaticParams() {
  try {
    // 빌드 시점에는 hostname이 없으므로 레거시 목록만. 테넌트는 dynamicParams로 런타임 조회.
    const slugs = await getCachedGuideSlugList(null);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ page }, { config }] = await Promise.all([
    resolveCachedGuidePage(slug),
    getResolvedSiteConfig(),
  ]);
  if (!page) return { title: "페이지를 찾을 수 없습니다" };

  const resolved = resolveSeoPage(page, config);
  const exactKeyword = normalizeSeoKeyword(page.keyword);
  const browserTitle = buildSeoBrowserTitle(
    enforceExactKeyword(resolved.title, exactKeyword),
    config.brandName,
    exactKeyword || page.slug
  );
  const region = extractRegionFromKeyword(exactKeyword) || "서귀포시";
  const seed = page.slug || exactKeyword;
  const contentImages = getSeoContentImageUrls(seed, config);
  const heroImage = getPageImageUrl(page, config);

  return {
    ...buildPageMetadata(config, {
      title: enforceExactKeyword(resolved.title, exactKeyword),
      description: enforceExactKeyword(resolved.description, exactKeyword),
      path: guidePageUrl(page.slug),
      ogPath: `/guide/${page.slug}/opengraph-image`,
      type: "article",
      keywords: [
        exactKeyword,
        "제주공인중개사",
        "서귀포공인중개사",
        "제주부동산",
        config.brandName,
      ],
      extraOgImages: [heroImage, ...contentImages],
      geo: {
        region: "KR-49",
        placename: region,
        position: `${DEFAULT_GEO.lat};${DEFAULT_GEO.lng}`,
      },
    }),
    title: { absolute: browserTitle },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const [{ page }, { config, tenant }] = await Promise.all([
    resolveCachedGuidePage(slug),
    getResolvedSiteConfig(),
  ]);
  if (!page) notFound();

  const exactKeyword = normalizeSeoKeyword(page.keyword);
  const resolved = resolveSeoPage(page, config);
  const title = enforceExactKeyword(resolved.title, exactKeyword);
  const description = enforceExactKeyword(resolved.description, exactKeyword);
  const contentHtml = enforceExactKeyword(resolved.content, exactKeyword);

  const { region: localRegion, partners: localPartners } = await ensureLocalPartners(
    page,
    config,
    tenant?.id
  );
  const currentRegion = extractRegionFromKeyword(exactKeyword) || localRegion;
  const [relatedKeywordLinks, nearbySubRegions] = await Promise.all([
    getRelatedKeywordPageLinks(page.slug, exactKeyword, 30),
    getNearbySubRegionLinks(currentRegion, page.slug, exactKeyword),
  ]);
  const faqs = (
    resolved.faqs?.length >= 2
      ? resolved.faqs.slice(0, 2)
      : buildDefaultFaqs(exactKeyword, config)
  ).map((f) => ({
    question: enforceExactKeyword(
      f.question
        .replace(/\{\{brandName\}\}/g, config.brandName)
        .replace(/\{\{phone\}\}/g, config.phone),
      exactKeyword
    ),
    answer: enforceExactKeyword(
      f.answer
        .replace(/\{\{brandName\}\}/g, config.brandName)
        .replace(/\{\{phone\}\}/g, config.phone)
        .replace(/\{\{address\}\}/g, config.address)
        .replace(/\{\{supportMax\}\}/g, config.supportMax),
      exactKeyword
    ),
  }));

  const showCompany = showCompanyContact(config.exposureMode);
  const regionLabel = currentRegion || "제주";
  const reviews = getSeoReviewsForKeyword(exactKeyword, 3);
  const bannerImg =
    resolved.imageUrl ||
    jejuImageUrl(pickJejuImageIndexes(1, `guide-banner-${page.slug}`)[0]);

  return (
    <article className="guide-landing">
      {/* 메인과 같은 풀블리드 배너 */}
      <section className="re-hero relative min-h-[52svh] sm:min-h-[58svh] flex flex-col justify-end overflow-hidden">
        <Image
          src={bannerImg}
          alt={exactKeyword}
          fill
          priority
          className="object-cover object-center re-hero-img"
          sizes="100vw"
        />
        <div className="re-hero-veil absolute inset-0" aria-hidden />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 pt-28 sm:pb-20">
          <p className="re-brand text-white/90 text-sm sm:text-base font-medium mb-3">
            {config.brandName}
          </p>
          <p className="text-[var(--re-gold)] text-xs sm:text-sm font-semibold tracking-wide mb-3">
            {exactKeyword}
          </p>
          <h1 className="text-[clamp(1.35rem,3.8vw,2.35rem)] font-semibold text-white leading-snug max-w-3xl mb-4">
            {title}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            {description}
          </p>
          <div className="flex flex-wrap gap-3">
            {showCompany && (
              <a href={`tel:${phoneToTel(config.phone)}`} className="re-btn re-btn-gold">
                전화 상담
              </a>
            )}
            <a href="#guide-body" className="re-btn re-btn-ghost">
              내용 보기
            </a>
          </div>
        </div>
      </section>

      {/* 서브 콘텐츠 */}
      <div id="guide-body" className="re-section re-section-paper scroll-mt-24">
        <div className="re-container max-w-3xl">
          <nav className="text-sm text-[var(--re-muted)] mb-8 flex flex-wrap gap-2 items-center">
            <Link href="/" className="hover:text-[var(--re-gold)] transition">
              홈
            </Link>
            <span aria-hidden>/</span>
            <span className="text-[var(--re-ink)] font-medium">{exactKeyword}</span>
          </nav>

          <div
            className="prose-seo guide-doc-body"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <section className="mt-12 pt-8 border-t border-black/8">
            <h2 className="re-heading text-xl mb-4">자주 묻는 질문</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-lg border border-gray-200 bg-white open:shadow-sm transition"
                >
                  <summary className="cursor-pointer list-none px-4 py-3.5 font-semibold text-[var(--re-ink)] flex items-center justify-between gap-3 text-sm sm:text-base">
                    <span>{faq.question}</span>
                    <span className="text-[var(--re-gold)] text-lg group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="px-4 pb-4 text-sm text-[var(--re-muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <GuideReviewsSection keyword={exactKeyword} reviews={reviews} />

          <RelatedKeywordPagesSection links={relatedKeywordLinks} />

          <NearbyRegionsSection
            cityLabel={nearbySubRegions.cityLabel}
            regions={nearbySubRegions.regions}
          />

          {localRegion && (
            <LocalPartnersSection
              region={localRegion}
              partners={localPartners}
              brandName={config.brandName}
            />
          )}

          <div className="mt-10 text-center border border-[var(--re-navy)]/10 bg-white rounded-xl p-6">
            <p className="text-sm text-[var(--re-muted)] mb-1">
              {regionLabel} · {exactKeyword}
            </p>
            <p className="font-bold text-[var(--re-ink)] mb-4">{config.brandName}</p>
            {showCompany && (
              <a
                href={`tel:${phoneToTel(config.phone)}`}
                className="re-btn re-btn-gold inline-flex"
              >
                전화 상담 {config.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            keywords: exactKeyword,
            image: [
              getOgImageAbsoluteUrl(config, `/guide/${page.slug}/opengraph-image`),
              getPageImageUrl(page, config),
              ...getSeoContentImageUrls(page.slug || exactKeyword, config),
            ],
            author: {
              "@type": "RealEstateAgent",
              name: config.brandName,
              telephone: config.phone,
              address: config.address,
            },
            publisher: {
              "@type": "Organization",
              name: config.brandName,
            },
            contentLocation: {
              "@type": "Place",
              name: regionLabel,
              geo: {
                "@type": "GeoCoordinates",
                latitude: DEFAULT_GEO.lat,
                longitude: DEFAULT_GEO.lng,
              },
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </article>
  );
}
