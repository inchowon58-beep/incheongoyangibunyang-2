import type { Metadata } from "next";
import {
  getStructuredData,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://incheongoyangibunyang-2.vercel.app"),
  title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
  description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
  keywords: ["인천고양이분양", "인천 고양이 분양", "인천 아기고양이", "건강한 고양이 분양", "고양이 분양 전문 인천"],
  authors: [{ name: "인천고양이분양" }],
  creator: "인천고양이분양",
  publisher: "인천고양이분양",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://incheongoyangibunyang-2.vercel.app",
    siteName: "인천고양이분양",
    title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
    description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
    images: [{ url: "/https://image.cattery.co.kr/maincoon/12.webp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "인천고양이분양, 건강하고 사랑스러운 아기고양이와 함께하세요",
    description: "인천고양이분양은 건강 검진 마친 아기고양이를 가족의 품으로 안내합니다. 다양한 품종, 투명한 분양 과정, 철저한 사후 관리로 행복한 반려생활을 시작하세요.",
    images: ["/https://image.cattery.co.kr/maincoon/12.webp"],
  },
  alternates: {
    canonical: "https://incheongoyangibunyang-2.vercel.app",
    types: {
      "application/rss+xml": "https://incheongoyangibunyang-2.vercel.app/feed.xml",
    },
  },
  category: "인천고양이분양",
  verification: {
    other: {
      "naver-site-verification": "PENDING",
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
        <meta name="naver-site-verification" content="PENDING" />
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
