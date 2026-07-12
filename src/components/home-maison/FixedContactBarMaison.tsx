"use client";

import { useSiteConfig } from "@/components/SiteConfigProvider";
import { showCompanyContact } from "@/lib/exposure-mode";

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.66 6.76-.15.54-.54 1.96-.62 2.27-.09.37.14.36.29.26.12-.08 1.96-1.33 2.76-1.88.61.09 1.25.14 1.91.14 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 5.5c0-1.1.9-2 2-2h2.2c.9 0 1.7.6 1.9 1.5l.6 2.4a2 2 0 01-.5 1.9l-1.2 1.2a12.5 12.5 0 005.6 5.6l1.2-1.2a2 2 0 011.9-.5l2.4.6c.9.2 1.5 1 1.5 1.9v2.2c0 1.1-.9 2-2 2C9.4 21.5 2.5 14.6 2.5 5.5z"
      />
    </svg>
  );
}

export default function FixedContactBarMaison() {
  const site = useSiteConfig();
  const showCompany = showCompanyContact(site.exposureMode);
  const kakao = site.kakaoUrl?.trim();

  if (!showCompany && !kakao) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-5 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3">
        {kakao && (
          <a
            href={kakao}
            target="_blank"
            rel="noopener noreferrer"
            className="maison-fab maison-fab-kakao group"
            aria-label="카톡문의"
          >
            <span className="maison-fab-icon">
              <KakaoIcon />
            </span>
            <span className="maison-fab-label">카톡문의</span>
          </a>
        )}
        {showCompany && (
          <a href={`tel:${site.phoneTel}`} className="maison-fab maison-fab-phone group" aria-label="전화문의">
            <span className="maison-fab-icon">
              <PhoneIcon />
            </span>
            <span className="maison-fab-label">{site.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}
