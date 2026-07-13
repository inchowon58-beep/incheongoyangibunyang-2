import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { GALLERY_INDICES } from "@/lib/maison-content";

export default async function GalleryMaison() {
  const site = await getSiteConfig();

  return (
    <section id="gallery" className="maison-section maison-section-mist py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="maison-eyebrow mb-4">Gallery</p>
          <h2 className="maison-display text-[clamp(1.75rem,4vw,2.6rem)] text-[var(--maison-ink)]">
            Soft Moments
          </h2>
          <p className="mt-3 text-[var(--maison-muted)]">메종드폼스키의 폼스키</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {GALLERY_INDICES.map((idx) => (
            <div
              key={idx}
              className="maison-media relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]"
            >
              <Image
                src={getImageUrl(idx, site)}
                alt={`폼스키 갤러리 ${idx}`}
                fill
                className="object-cover object-center hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
