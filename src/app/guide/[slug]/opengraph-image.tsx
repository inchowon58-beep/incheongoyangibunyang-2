import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { resolvePageByKey } from "@/lib/pages-resolver";
import { getSiteConfig, resolveSeoPage } from "@/lib/site-config";
import { OgBrandedLayout, OG_SIZE } from "@/lib/og-template";

export const alt = "꼬똥드툴레아 메종드꼬똥 가이드";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuideOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const [{ page }, config] = await Promise.all([
    resolvePageByKey(slug),
    getSiteConfig(),
  ]);
  if (!page) notFound();

  const resolved = resolveSeoPage(page, config);
  const title =
    resolved.title.length > 48 ? `${resolved.title.slice(0, 48)}…` : resolved.title;

  return new ImageResponse(
    (
      <OgBrandedLayout
        brandName={config.brandName}
        title={title}
        subtitle={resolved.description.slice(0, 90)}
        badge={page.keyword}
      />
    ),
    {
      ...OG_SIZE,
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    }
  );
}
