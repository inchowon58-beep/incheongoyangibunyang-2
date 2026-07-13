import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { MAISON_REVIEWS } from "@/lib/maison-content";

export default async function ReviewsMaison() {
  const site = await getSiteConfig();

  return (
    <section id="reviews" className="maison-section py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="maison-eyebrow mb-4">Testimonials</p>
          <h2 className="maison-display text-[clamp(1.75rem,4vw,2.6rem)] text-[var(--maison-ink)] mb-3">
            Family Reviews
          </h2>
          <p className="text-[var(--maison-muted)]">
            메종드폼스키와 함께한 아홉 가족의 이야기
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {MAISON_REVIEWS.map((review) => (
            <article
              key={review.name}
              className="maison-soft-block rounded-[1.75rem] overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={getImageUrl(review.imageIndex, site)}
                  alt={`${review.name} 님의 폼스키`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex gap-0.5 mb-3" aria-label={`${review.rating}점`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i} className="text-[var(--maison-gold)] text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[var(--maison-muted)] leading-relaxed flex-1 mb-5">
                  &ldquo;{review.text}&rdquo;
                </p>
                <footer>
                  <p className="text-sm font-medium text-[var(--maison-ink)]">{review.name}</p>
                  <p className="text-xs text-[var(--maison-muted)] mt-0.5 tracking-wide">
                    {review.location}
                  </p>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
