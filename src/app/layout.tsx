import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import TenantThemeStyles from "@/components/TenantThemeStyles";
import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import { buildSiteMetadata } from "@/lib/metadata";
import { NAVER_SITE_VERIFICATION } from "@/lib/constants";
import { parseSiteDesignId } from "@/lib/site-designs";

export async function generateMetadata(): Promise<Metadata> {
  const { config, tenant } = await getResolvedSiteConfig();
  const meta = buildSiteMetadata(config);
  if (tenant?.naver_verification) {
    return {
      ...meta,
      other: {
        ...(meta.other || {}),
        "naver-site-verification": tenant.naver_verification,
      },
    };
  }
  return meta;
}

export const viewport: Viewport = {
  themeColor: "#FFE8DC",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config, tenant, tenantUi, theme } = await getResolvedSiteConfig();
  const naverVerification =
    tenant?.naver_verification?.trim() || NAVER_SITE_VERIFICATION;
  const siteDesign = parseSiteDesignId(tenantUi?.siteDesign);
  const bodyClass =
    siteDesign === "m"
      ? "maison-root antialiased min-h-screen flex flex-col"
      : "home-re-body antialiased min-h-screen flex flex-col";

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "PetStore",
    name: config.brandName,
    legalName: config.companyName,
    description: config.description,
    telephone: config.phone,
    url: config.url,
    ...(config.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: config.address,
            addressCountry: "KR",
          },
        }
      : {}),
    ...(config.representative
      ? {
          founder: {
            "@type": "Person",
            name: config.representative,
          },
        }
      : {}),
    ...(config.businessNumber ? { taxID: config.businessNumber } : {}),
    sameAs: [config.kakaoUrl, config.placeUrl].filter(Boolean),
  };

  return (
    <html lang="ko">
      <head>
        <TenantThemeStyles theme={theme} />
        <meta name="naver-site-verification" content={naverVerification} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${config.brandName} RSS`}
          href="/feed.xml"
        />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/Paperlogy/Paperlogy.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessJsonLd),
          }}
        />
      </head>
      <body className={bodyClass}>
        <SiteConfigProvider config={config} tenantUi={tenantUi}>
          <SiteChrome>{children}</SiteChrome>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
