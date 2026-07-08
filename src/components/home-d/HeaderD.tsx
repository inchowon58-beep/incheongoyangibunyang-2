"use client";

import { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import InquiryLinkButton from "@/components/InquiryLinkButton";
import { showCompanyContact } from "@/lib/exposure-mode";

const NAV = [
  { href: "/#about", label: "Company" },
  { href: "/#services", label: "Services" },
  { href: "/#guide", label: "Guide" },
  { href: "/#reviews", label: "Review" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
] as const;

export default function HeaderD() {
  const site = useSiteConfig();
  const [open, setOpen] = useState(false);
  const showCompany = showCompanyContact(site.exposureMode);

  return (
    <header className="home-d-header sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.25rem]">
          <Link href="/" className="group shrink-0">
            <span className="block text-base lg:text-lg font-semibold text-gray-900 tracking-tight">
              {site.brandName}
            </span>
            <span className="block text-[10px] text-gray-400 tracking-wide mt-0.5">
              {site.tagline}
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {showCompany && (
              <a
                href={`tel:${site.phoneTel}`}
                className="text-sm font-medium text-gray-800 hover:text-orange transition"
              >
                {site.phone}
              </a>
            )}
            <InquiryLinkButton
              context="header"
              className="!rounded-sm !px-5 !py-2 !text-sm !font-medium !tracking-wide"
            />
          </div>

          <button
            type="button"
            className="xl:hidden p-2 text-gray-700 text-xl"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-gray-700 py-1"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <InquiryLinkButton context="header" className="w-full justify-center !rounded-sm" />
        </div>
      )}
    </header>
  );
}
