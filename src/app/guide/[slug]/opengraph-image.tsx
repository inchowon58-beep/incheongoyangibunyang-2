import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { resolvePageByKey } from "@/lib/pages-resolver";
import { getSiteConfig, resolveSeoPage, getPageImageUrl } from "@/lib/site-config";
import { OG_SIZE } from "@/lib/og-template";
import { stripSeoJargon, enforceExactKeyword, normalizeSeoKeyword } from "@/lib/seo-keyword";

export const alt = "폼스키 메종드폼스키 가이드";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

/** 상세페이지마다 해당 글 대표 사진 + 제목으로 OG 이미지 생성 (네이버 공유용) */
export default async function GuideOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const [{ page }, config] = await Promise.all([
    resolvePageByKey(slug),
    getSiteConfig(),
  ]);
  if (!page) notFound();

  const resolved = resolveSeoPage(page, config);
  const exactKeyword = normalizeSeoKeyword(page.keyword);
  const title = stripSeoJargon(
    enforceExactKeyword(resolved.title, exactKeyword)
  );
  const displayTitle = title.length > 42 ? `${title.slice(0, 42)}…` : title;
  const photoUrl = getPageImageUrl(page, config);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#2c2622",
        }}
      >
        {/* 페이지별 실제 폼스키 사진 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(28,22,18,0.88) 0%, rgba(28,22,18,0.45) 45%, rgba(28,22,18,0.25) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "52px 64px",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#d4b896",
              fontSize: 22,
              letterSpacing: "0.18em",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Maison de Pomsky
          </div>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: 46,
              fontWeight: 600,
              lineHeight: 1.25,
              maxWidth: 980,
              marginBottom: 14,
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.78)",
              fontSize: 24,
            }}
          >
            {config.brandName} · {exactKeyword}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    }
  );
}
