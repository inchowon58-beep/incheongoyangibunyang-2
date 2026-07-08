import Link from "next/link";
import { getSiteConfig } from "@/lib/site-config";
import { INQUIRY_SECTION_ID, inquiryAccentButtonClass } from "@/lib/exposure-mode";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import { buildHeroSubcopy } from "@/lib/brand-copy";

export default async function HeroC() {
  const site = await getSiteConfig();
  const { tenant, tenantUi } = await getResolvedSiteConfig();

  const lines = tenantUi?.heroLines || ["함께할 수 없을 때,", "버리지 말고", "안전하게 맡기세요."];
  const subline =
    tenantUi?.heroSubcopy ||
    tenantUi?.heroSubline ||
    buildHeroSubcopy(tenant?.subdomain || site.brandName);

  return (
    <section className="home-c-hero relative py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-8">
          {tenantUi?.heroHeadline || site.brandName}
        </p>

        <h1 className="home-c-editorial text-4xl sm:text-5xl lg:text-7xl font-light text-stone-900 leading-[1.15] tracking-tight mb-8">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mb-10">
          {subline}
        </p>

        <Link
          href="/#cases"
          className="inline-flex items-center gap-2 text-sm text-stone-700 hover:text-orange transition group"
        >
          <span>파양·분양 사례 보기</span>
          <span className="group-hover:translate-x-0.5 transition-transform">↘</span>
        </Link>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href={`/#${INQUIRY_SECTION_ID}`}
            className={`inline-flex items-center gap-2 font-medium px-7 py-3.5 rounded-full transition text-sm ${inquiryAccentButtonClass(site.exposureMode)}`}
          >
            파양·분양 상담
          </Link>
        </div>
      </div>
    </section>
  );
}
