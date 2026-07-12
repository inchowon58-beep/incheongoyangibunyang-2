"use client";

import { usePathname } from "next/navigation";
import HeaderRe from "@/components/home-re/HeaderRe";
import FooterRe from "@/components/home-re/FooterRe";
import FixedContactBarRe from "@/components/home-re/FixedContactBarRe";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="admin-shell min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <>
      <HeaderRe />
      <main className="flex-1 pb-20">{children}</main>
      <FooterRe />
      <FixedContactBarRe />
    </>
  );
}
