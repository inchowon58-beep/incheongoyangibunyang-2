"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { MAISON_NAV } from "@/lib/maison-content";
import { showCompanyContact } from "@/lib/exposure-mode";

export default function HeaderMaison() {
  const site = useSiteConfig();
  const [open, setOpen] = useState(false);
  const showCompany = showCompanyContact(site.exposureMode);
  const kakao = site.kakaoUrl?.trim();

  return (
    <header className="maison-header sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link href="/" className="group min-w-0">
            <span className="maison-brand-en block text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-[var(--maison-gold)]">
              Maison de Coton
            </span>
            <span className="block text-lg sm:text-xl font-medium text-[var(--maison-ink)] tracking-tight truncate">
              {site.brandName}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {MAISON_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] tracking-[0.22em] uppercase text-[var(--maison-muted)] hover:text-[var(--maison-ink)] transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {showCompany && (
              <a
                href={`tel:${site.phoneTel}`}
                className="text-sm text-[var(--maison-ink)] hover:text-[var(--maison-gold)] transition"
              >
                {site.phone}
              </a>
            )}
            {kakao && (
              <a
                href={kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="maison-btn-soft text-xs tracking-wide"
              >
                Kakao
              </a>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2.5 rounded-full text-[var(--maison-ink)] hover:bg-[var(--maison-mist)] transition"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
          >
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-3.5 h-px bg-current ml-auto" />
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--maison-line)] bg-[var(--maison-pearl)]/98 backdrop-blur-md px-4 py-5 space-y-1">
          {MAISON_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2.5 text-sm text-[var(--maison-ink)]"
              onClick={() => setOpen(false)}
            >
              <span className="tracking-[0.18em] uppercase text-xs text-[var(--maison-muted)] mr-2">
                {item.label}
              </span>
            </Link>
          ))}
          {showCompany && (
            <a
              href={`tel:${site.phoneTel}`}
              className="block py-2.5 text-sm font-medium text-[var(--maison-ink)]"
            >
              {site.phone}
            </a>
          )}
          {kakao && (
            <a
              href={kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 text-sm text-[var(--maison-gold)]"
              onClick={() => setOpen(false)}
            >
              카톡문의
            </a>
          )}
        </div>
      )}
    </header>
  );
}
