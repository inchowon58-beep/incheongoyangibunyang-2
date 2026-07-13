import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site-config";
import { OgBrandedLayout, OG_SIZE } from "@/lib/og-template";

export const alt = "꼬똥드툴레아 메종드꼬똥 · Maison de Coton";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const config = await getSiteConfig();

  return new ImageResponse(
    (
      <OgBrandedLayout
        brandName={config.brandName}
        title="꼬똥드툴레아 메종드꼬똥"
        subtitle={config.description.slice(0, 90)}
        badge="Maison de Coton"
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
