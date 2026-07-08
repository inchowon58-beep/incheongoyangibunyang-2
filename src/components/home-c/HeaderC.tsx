"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import InquiryLinkButton from "@/components/InquiryLinkButton";
import { showCompanyContact } from "@/lib/exposure-mode";

const NAV = [
  { href: "/#story", label: "센터 소개" },
  { href: "/#scenarios", label: "파양 안내" },
  { href: "/#cases", label: "파양·분양" },
  { href: "/#support", label: "입소 비용" },
  { href: "/#reviews", label: "이용후기" },
  { href: "/#process", label: "상담 절차" },
  { href: "/#contact", label: "문의" },
] as const;

export default function HeaderC() {
  const site = useSiteConfig();
  const [open, setOpen] = useState(false);
  const showCompany = showCompanyContact(site.exposureMode);

  return (
    <header className="home-c-header sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link href="/" className="group">
            <span className="block text-base lg:text-lg font-semibold text-stone-900 tracking-tight">
              {site.brandName}
            </span>
            <span className="block text-[10px] text-stone-400 tracking-wide">
              {site.tagline}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-stone-600 hover:text-stone-900 transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            {showCompany && (
              <a
                href={`tel:${site.phoneTel}`}
                className="text-sm font-medium text-stone-800 hover:text-orange transition"
              >
                {site.phone}
              </a>
            )}
            <InquiryLinkButton
              context="header"
              className="!rounded-full !px-5 !py-2 !text-sm !font-medium"
            />
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-stone-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-stone-200/60 bg-[#faf8f5] px-4 py-4 space-y-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-stone-700 py-1"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {showCompany && (
            <a href={`tel:${site.phoneTel}`} className="block text-sm font-medium text-stone-900 py-1">
              {site.phone}
            </a>
          )}
          <InquiryLinkButton context="header" className="w-full justify-center !rounded-full" />
        </div>
      )}
    </header>
  );
}
