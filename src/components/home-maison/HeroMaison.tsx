import Image from "next/image";
import Link from "next/link";
import { getSiteConfig, phoneToTel } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { showCompanyContact } from "@/lib/exposure-mode";

export default async function HeroMaison() {
  const site = await getSiteConfig();
  const showCompany = showCompanyContact(site.exposureMode);
  const kakao = site.kakaoUrl?.trim();

  return (
    <section className="maison-hero relative min-h-[92vh] flex items-end overflow-hidden">
      <Image
        src={getImageUrl(2, site)}
        alt="꼬똥드툴레아 메종드꼬똥"
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />
      <div className="maison-hero-veil absolute inset-0" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 pt-32">
        <p className="maison-eyebrow text-white/80 mb-5 animate-maison-fade">
          Coton de Tuléar · Since the Courts of Madagascar
        </p>
        <h1 className="maison-display text-white max-w-3xl mb-4 animate-maison-rise">
          <span className="block text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.05] font-normal">
            Maison de Coton
          </span>
          <span className="block mt-3 text-[clamp(1.35rem,3.2vw,2rem)] font-light tracking-wide text-white/95">
            꼬똥드툴레아 메종드꼬똥
          </span>
        </h1>
        <p className="max-w-xl text-sm sm:text-base text-white/85 leading-relaxed mb-10 animate-maison-rise-delay">
          왕실이 아끼던 코튼 코트의 반려견.
          <br className="hidden sm:block" />
          역사와 품성, 그리고 품격 있는 분양까지 — 부드럽게 안내합니다.
        </p>
        <div className="flex flex-wrap gap-3 animate-maison-rise-delay-2">
          <Link href="/#breed" className="maison-btn-light">
            Discover the Breed
          </Link>
          {kakao ? (
            <a
              href={kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="maison-btn-ghost"
            >
              카톡문의
            </a>
          ) : (
            <Link href="/#contact" className="maison-btn-ghost">
              Private Inquiry
            </Link>
          )}
          {showCompany && (
            <a href={`tel:${phoneToTel(site.phone)}`} className="maison-btn-ghost">
              {site.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
