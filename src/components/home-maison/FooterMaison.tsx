"use client";

import Link from "next/link";
import FooterAdminLinks from "@/components/FooterAdminLinks";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { showCompanyContact } from "@/lib/exposure-mode";
import { MAISON_NAV } from "@/lib/maison-content";

export default function FooterMaison() {
  const site = useSiteConfig();
  const showCompany = showCompanyContact(site.exposureMode);
  const kakao = site.kakaoUrl?.trim();

  return (
    <footer id="contact" className="maison-footer pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 mb-14">
          <div>
            <p className="maison-eyebrow text-[var(--maison-gold-soft)] mb-3">Contact</p>
            <h2 className="maison-display text-3xl sm:text-4xl text-white mb-2">
              Maison de Coton
            </h2>
            <p className="text-white/70 text-lg mb-6">{site.companyName || site.brandName}</p>
            <p className="text-white/55 leading-relaxed max-w-md mb-8">
              꼬똥드툴레아에 대한 궁금증, 분양 상담, 케어 문의 —
              편안하게 말씀해 주세요. 프라이빗하게 답변드립니다.
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
                <a href={`tel:${site.phoneTel}`} className="maison-btn-ghost">
                  {site.phone}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-10">
            <nav className="flex flex-wrap gap-x-6 gap-y-3">
              {MAISON_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs tracking-[0.2em] uppercase text-white/45 hover:text-white transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="rounded-[1.75rem] bg-white/5 border border-white/10 p-6 sm:p-8 space-y-3">
              {showCompany && (
                <p className="text-sm text-white/80">
                  <span className="text-white/40 text-xs tracking-[0.2em] uppercase mr-3">
                    Phone
                  </span>
                  {site.phone}
                </p>
              )}
              {kakao && (
                <p className="text-sm text-white/80 break-all">
                  <span className="text-white/40 text-xs tracking-[0.2em] uppercase mr-3">
                    Kakao
                  </span>
                  상담 가능
                </p>
              )}
              {site.address && (
                <p className="text-sm text-white/60">
                  <span className="text-white/40 text-xs tracking-[0.2em] uppercase mr-3">
                    Address
                  </span>
                  {site.address}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} {site.brandName}. All rights reserved.
          </p>
          <FooterAdminLinks />
        </div>
      </div>
    </footer>
  );
}
