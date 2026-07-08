import Image from "next/image";
import Link from "next/link";
import { getSiteConfig, phoneToTel } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { INQUIRY_SECTION_ID, inquiryAccentButtonClass, showCompanyContact } from "@/lib/exposure-mode";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import { getDefaultStats } from "@/lib/tenant-content";
import { buildHeroSubcopy } from "@/lib/brand-copy";

export default async function HeroB() {
  const site = await getSiteConfig();
  const showCompany = showCompanyContact(site.exposureMode);
  const { tenant, tenantUi } = await getResolvedSiteConfig();
  const headline = tenantUi?.heroHeadline || site.brandName;
  const subcopy =
    tenantUi?.heroSubcopy ||
    tenantUi?.aboutText ||
    buildHeroSubcopy(tenant?.subdomain || site.brandName);
  const stats = tenantUi?.stats?.length ? tenantUi.stats : getDefaultStats();
  const badges = tenantUi?.trustBadges || [];

  return (
    <section className="home-b-hero relative min-h-[88vh] flex items-center overflow-hidden">
      <Image
        src={getImageUrl(tenantUi?.heroImageIndex || 1, site)}
        alt={`${site.brandName} 파양·무료분양`}
        fill
        className="object-cover"
        priority
      />
      <div className="home-b-hero-overlay absolute inset-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
        <p className="text-sm text-orange font-semibold mb-4 tracking-wide">
          365일 파양·무료분양 상담 접수
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug mb-6">
          {headline}
        </h1>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8">
          {subcopy}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link
            href={`/#${INQUIRY_SECTION_ID}`}
            className={`inline-flex items-center gap-2 font-bold px-8 py-4 rounded-lg transition shadow-lg text-base ${inquiryAccentButtonClass(site.exposureMode)}`}
          >
            빠른 문의 신청
          </Link>
          {showCompany && (
            <a
              href={`tel:${phoneToTel(site.phone)}`}
              className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 font-bold px-8 py-4 rounded-lg hover:bg-white/20 transition text-base"
            >
              바로 전화하기
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="home-b-hero-stat rounded-xl bg-white/10 backdrop-blur border border-white/10 py-3 px-2">
              <p className="text-xl sm:text-2xl font-black text-orange">
                {stat.value}
                <span className="text-sm text-white/80">{stat.suffix}</span>
              </p>
              <p className="text-[10px] sm:text-xs text-gray-300 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="text-[10px] sm:text-xs px-3 py-1.5 rounded-full bg-white/10 text-gray-100 border border-white/10"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400 tracking-widest">SCROLL</p>
      </div>
    </section>
  );
}
