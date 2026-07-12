import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import TenantThemeStyles from "@/components/TenantThemeStyles";
import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { getResolvedSiteConfig } from "@/utils/siteConfig";
import { buildSiteMetadata } from "@/lib/metadata";
import { NAVER_SITE_VERIFICATION } from "@/lib/constants";

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
  themeColor: "#0b1c33",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config, tenant, tenantUi, theme } = await getResolvedSiteConfig();
  const naverVerification =
    tenant?.naver_verification?.trim() || NAVER_SITE_VERIFICATION;

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: config.brandName,
    legalName: config.companyName,
    description: config.description,
    telephone: config.phone,
    url: config.url,
    image: `${config.url.replace(/\/$/, "")}/images/ceo-yangjunmo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "동홍중앙로58-1, 1층",
      addressLocality: "서귀포시",
      addressRegion: "제주특별자치도",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.2559783,
      longitude: 126.5721595,
    },
    founder: {
      "@type": "Person",
      name: config.representative,
    },
    award: "2026 서귀포시 우수공인중개사",
    taxID: config.businessNumber,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "제주특별자치도 서귀포시",
    },
    sameAs: [config.placeUrl].filter(Boolean),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessJsonLd),
          }}
        />
      </head>
      <body className="home-re-body antialiased min-h-screen flex flex-col">
        <SiteConfigProvider config={config} tenantUi={tenantUi}>
          <SiteChrome>{children}</SiteChrome>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
