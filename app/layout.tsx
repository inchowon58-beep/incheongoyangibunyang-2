import type { Metadata } from "next";
import {
  getStructuredData,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ansan.cattery.co.kr"),
  title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
  description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
  keywords: ["https://ansan.cattery.co.kr/"],
  authors: [{ name: "https://ansan.cattery.co.kr/" }],
  creator: "https://ansan.cattery.co.kr/",
  publisher: "https://ansan.cattery.co.kr/",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://ansan.cattery.co.kr",
    siteName: "https://ansan.cattery.co.kr/",
    title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
    description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
    images: [{ url: "/images/landing-01.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
    description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
    images: ["/images/landing-01.jpg"],
  },
  alternates: {
    canonical: "https://ansan.cattery.co.kr",
    types: {
      "application/rss+xml": "https://ansan.cattery.co.kr/feed.xml",
    },
  },
  category: "https://ansan.cattery.co.kr/",
  verification: {
    other: {
      "naver-site-verification": "7c59b3f87b22e5a089b891da64edf7f69e616856",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = getStructuredData();

  return (
    <html lang="ko">
      <head>
        <meta name="naver-site-verification" content="7c59b3f87b22e5a089b891da64edf7f69e616856" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="font-sans pb-safe-floating lg:pb-0">{children}</body>
    </html>
  );
}
