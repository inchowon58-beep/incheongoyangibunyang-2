import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import RelatedKeywordPagesSection from "@/components/RelatedKeywordPagesSection";
import NearbyRegionsSection from "@/components/NearbyRegionsSection";
import { showCompanyContact } from "@/lib/exposure-mode";
import {
  buildSeoBrowserTitle,
  enforceExactKeyword,
  normalizeSeoKeyword,
  stripSeoJargon,
  stripSeoJargonFromHtml,
} from "@/lib/seo-keyword";
import GuideReviewsSection from "@/components/GuideReviewsSection";
import { getSeoReviewsForKeyword } from "@/lib/seo-reviews";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import {
  buildGuideSeoKeywords,
  resolveSeoGeoFromKeyword,
} from "@/lib/seo-geo";

/**
 * SSR + Data Cache (ISR)
 * - 서버에서 글을 조립해 완성 HTML을 로봇에게 제공
 * - 1시간 캐시 · 테넌트는 Supabase tenant_seo_pages
 */
export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
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
  const browserTitle = stripSeoJargon(
    buildSeoBrowserTitle(
      enforceExactKeyword(resolved.title, exactKeyword),
      config.brandName,
      exactKeyword || page.slug
    )
  );
  const geo = resolveSeoGeoFromKeyword(exactKeyword);
  const heroImage = getPageImageUrl(page, config);

  return {
    ...buildPageMetadata(config, {
      title: stripSeoJargon(enforceExactKeyword(resolved.title, exactKeyword)),
      description: stripSeoJargon(
        enforceExactKeyword(resolved.description, exactKeyword)
      ),
      path: guidePageUrl(page.slug),
      ogPath: `/guide/${page.slug}/opengraph-image`,
      type: "article",
      keywords: buildGuideSeoKeywords(exactKeyword, config.brandName),
      extraOgImages: [heroImage],
      geo: {
        region: geo.region,
        placename: geo.placename,
        position: geo.position,
      },
    }),
    title: { absolute: browserTitle },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const [{ page }, { config }] = await Promise.all([
    resolveCachedGuidePage(slug),
    getResolvedSiteConfig(),
  ]);
  if (!page) notFound();

  const exactKeyword = normalizeSeoKeyword(page.keyword);
  const resolved = resolveSeoPage(page, config);
  const title = stripSeoJargon(enforceExactKeyword(resolved.title, exactKeyword));
  const description = stripSeoJargon(
    enforceExactKeyword(resolved.description, exactKeyword)
  );
  const contentHtml = stripSeoJargonFromHtml(
    enforceExactKeyword(resolved.content, exactKeyword)
  );
  const geo = resolveSeoGeoFromKeyword(exactKeyword);
  const currentRegion = extractRegionFromKeyword(exactKeyword) || geo.placename;

  const [relatedKeywordLinks, nearbySubRegions] = await Promise.all([
    getRelatedKeywordPageLinks(page.slug, exactKeyword, 30, config),
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
  const regionLabel = currentRegion || "대한민국";
  const reviews = getSeoReviewsForKeyword(exactKeyword, 3);
  const bannerImg = resolved.imageUrl || getPageImageUrl(page, config);
  const kakao = config.kakaoUrl?.trim();

  return (
    <article className="guide-landing maison-guide">
      <section className="maison-hero relative min-h-[52svh] sm:min-h-[58svh] flex flex-col justify-end overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]">
        <Image
          src={bannerImg}
          alt={exactKeyword}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="maison-hero-veil absolute inset-0" aria-hidden />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-14 pt-28 sm:pb-18">
          <p className="maison-eyebrow text-white/80 mb-3">Maison Guide</p>
          <p className="text-[var(--maison-gold-soft)] text-xs sm:text-sm tracking-wide mb-3">
            {exactKeyword}
          </p>
          <h1 className="maison-display text-[clamp(1.45rem,4vw,2.5rem)] text-white leading-snug max-w-3xl mb-4">
            {title}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            {description}
          </p>
          <div className="flex flex-wrap gap-3">
            {kakao && (
              <a
                href={kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="maison-btn-light"
              >
                카톡문의
              </a>
            )}
            {showCompany && (
              <a href={`tel:${phoneToTel(config.phone)}`} className="maison-btn-ghost">
                {config.phone}
              </a>
            )}
            <a href="#guide-body" className="maison-btn-ghost">
              Read Guide
            </a>
          </div>
        </div>
      </section>

      <div id="guide-body" className="maison-section scroll-mt-24 py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="text-sm text-[var(--maison-muted)] mb-8 flex flex-wrap gap-2 items-center">
            <Link href="/" className="hover:text-[var(--maison-gold)] transition">
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="text-[var(--maison-ink)] font-medium">{exactKeyword}</span>
          </nav>

          <div
            className="prose-seo guide-doc-body maison-prose"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <section className="mt-14 pt-10 border-t border-[var(--maison-line)]">
            <p className="maison-eyebrow mb-2">FAQ</p>
            <h2 className="maison-display text-2xl text-[var(--maison-ink)] mb-6">
              Frequently Asked
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group maison-soft-block rounded-[1.25rem] open:shadow-sm transition"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 font-medium text-[var(--maison-ink)] flex items-center justify-between gap-3 text-sm sm:text-base">
                    <span>{faq.question}</span>
                    <span className="text-[var(--maison-gold)] text-lg group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-[var(--maison-muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <GuideReviewsSection keyword={exactKeyword} reviews={reviews} config={config} />

          <RelatedKeywordPagesSection links={relatedKeywordLinks} />

          <NearbyRegionsSection
            cityLabel={nearbySubRegions.cityLabel}
            regions={nearbySubRegions.regions}
          />

          <div className="mt-12 maison-soft-block rounded-[1.75rem] p-8 text-center">
            <p className="maison-eyebrow mb-2">Private Inquiry</p>
            <p className="text-sm text-[var(--maison-muted)] mb-1">
              {regionLabel} · {exactKeyword}
            </p>
            <p className="maison-display text-2xl text-[var(--maison-ink)] mb-5">
              {config.brandName}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {kakao && (
                <a
                  href={kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maison-btn-soft"
                >
                  카톡문의
                </a>
              )}
              {showCompany && (
                <a
                  href={`tel:${phoneToTel(config.phone)}`}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--maison-line)] text-sm font-medium text-[var(--maison-ink)] hover:border-[var(--maison-gold)] transition"
                >
                  {config.phone}
                </a>
              )}
            </div>
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
            keywords: buildGuideSeoKeywords(exactKeyword, config.brandName).join(", "),
            image: [
              getOgImageAbsoluteUrl(config, `/guide/${page.slug}/opengraph-image`),
              getPageImageUrl(page, config),
              ...getSeoContentImageUrls(page.slug || exactKeyword, config),
            ],
            author: {
              "@type": "Organization",
              name: config.brandName,
              telephone: config.phone,
              ...(config.address ? { address: config.address } : {}),
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
                latitude: geo.lat,
                longitude: geo.lng,
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
