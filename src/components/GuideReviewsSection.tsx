import Image from "next/image";
import type { SeoReview } from "@/lib/seo-reviews";
import type { SiteConfig } from "@/lib/site-config-types";
import { getImageUrl } from "@/lib/site-images";

interface Props {
  keyword: string;
  reviews: SeoReview[];
  config: SiteConfig;
}

export default function GuideReviewsSection({ keyword, reviews, config }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[var(--maison-line)]">
      <p className="maison-eyebrow mb-2">Testimonials</p>
      <h2 className="maison-display text-2xl text-[var(--maison-ink)] mb-2">Family Reviews</h2>
      <p className="text-sm text-[var(--maison-muted)] mb-8">
        {keyword} · 메종드꼬똥과 함께한 이야기
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        {reviews.map((r) => (
          <article
            key={`${r.name}-${r.area}-${r.text.slice(0, 12)}`}
            className="maison-soft-block overflow-hidden rounded-[1.5rem] flex flex-col"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={getImageUrl(r.imageIndex ?? 1, config)}
                alt={`${r.name} 님의 꼬똥드툴레아`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="text-[var(--maison-gold)] text-sm tracking-wider mb-2" aria-hidden>
                ★★★★★
              </div>
              <p className="text-sm text-[var(--maison-muted)] leading-relaxed flex-1 mb-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <footer>
                <p className="text-sm font-medium text-[var(--maison-ink)]">{r.name}</p>
                <p className="text-xs text-[var(--maison-muted)] mt-0.5">{r.area}</p>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
