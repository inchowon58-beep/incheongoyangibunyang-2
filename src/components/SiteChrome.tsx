"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FixedContactBar from "@/components/FixedContactBar";
import HeaderB from "@/components/home-b/HeaderB";
import FooterB from "@/components/home-b/FooterB";
import FixedContactBarB from "@/components/home-b/FixedContactBarB";
import HeaderC from "@/components/home-c/HeaderC";
import FooterC from "@/components/home-c/FooterC";
import FixedContactBarC from "@/components/home-c/FixedContactBarC";
import HeaderD from "@/components/home-d/HeaderD";
import FooterD from "@/components/home-d/FooterD";
import FixedContactBarD from "@/components/home-d/FixedContactBarD";
import HeaderRe from "@/components/home-re/HeaderRe";
import FooterRe from "@/components/home-re/FooterRe";
import FixedContactBarRe from "@/components/home-re/FixedContactBarRe";
import HeaderMaison from "@/components/home-maison/HeaderMaison";
import FooterMaison from "@/components/home-maison/FooterMaison";
import FixedContactBarMaison from "@/components/home-maison/FixedContactBarMaison";
import { useTenantUi } from "@/components/SiteConfigProvider";
import { parseSiteDesignId } from "@/lib/site-designs";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const tenantUi = useTenantUi();
  const isAdmin = pathname.startsWith("/admin");
  const siteDesign = parseSiteDesignId(tenantUi?.siteDesign);

  if (isAdmin) {
    return (
      <div className="admin-shell min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  if (siteDesign === "m") {
    return (
      <>
        <HeaderMaison />
        <main className="flex-1">{children}</main>
        <FooterMaison />
        <FixedContactBarMaison />
      </>
    );
  }

  // 가이드(/guide)도 메인과 동일한 사이트 크롬 유지
  if (siteDesign === "e") {
    return (
      <>
        <HeaderRe />
        <main className="flex-1 pb-20">{children}</main>
        <FooterRe />
        <FixedContactBarRe />
      </>
    );
  }

  if (siteDesign === "d") {
    return (
      <>
        <HeaderD />
        <main className="flex-1">{children}</main>
        <FooterD />
        <FixedContactBarD />
      </>
    );
  }

  if (siteDesign === "c") {
    return (
      <>
        <HeaderC />
        <main className="flex-1">{children}</main>
        <FooterC />
        <FixedContactBarC />
      </>
    );
  }

  if (siteDesign === "b") {
    return (
      <>
        <HeaderB />
        <main className="flex-1">{children}</main>
        <FooterB />
        <FixedContactBarB />
      </>
    );
  }

  return (
    <>
      <Header headerStyle="sticky" />
      <main className="flex-1 pb-24">{children}</main>
      <Footer isLoggedIn={false} />
      <FixedContactBar />
    </>
  );
}
