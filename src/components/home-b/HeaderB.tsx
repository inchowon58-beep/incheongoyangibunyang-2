"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import InquiryLinkButton from "@/components/InquiryLinkButton";
import { showCompanyContact } from "@/lib/exposure-mode";

const NAV = [
  { href: "/#about", label: "소개" },
  { href: "/#business", label: "서비스" },
  { href: "/#process", label: "상담절차" },
  { href: "/#whyUs", label: "선택이유" },
  { href: "/#support", label: "입소비용" },
  { href: "/#cases", label: "파양·분양" },
  { href: "/#reviews", label: "이용후기" },
] as const;

export default function HeaderB() {
  const site = useSiteConfig();
  const [open, setOpen] = useState(false);
  const showCompany = showCompanyContact(site.exposureMode);

  return (
    <header className="home-b-header sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link href="/" className="font-black text-dark text-lg lg:text-xl hover:text-orange transition">
            {site.brandName}
            <span className="block text-[10px] sm:text-xs font-normal text-gray-400 mt-0.5">
              {site.tagline}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-orange transition whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {showCompany && (
              <a
                href={`tel:${site.phoneTel}`}
                className="text-sm font-bold text-dark hover:text-orange transition"
              >
                {site.phone}
              </a>
            )}
            <InquiryLinkButton context="header" className="!rounded-lg !px-4 !py-2.5 !text-sm" />
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-dark"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm font-medium text-gray-700 py-1"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <InquiryLinkButton context="header" className="w-full justify-center !rounded-lg" />
        </div>
      )}
    </header>
  );
}
