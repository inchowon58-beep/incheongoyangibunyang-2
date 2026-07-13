import Image from "next/image";
import Link from "next/link";
import type { RelatedKeywordPageLink } from "@/lib/related-keyword-pages";

interface Props {
  links: RelatedKeywordPageLink[];
}

export default function RelatedKeywordPagesSection({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[var(--maison-line)]">
      <p className="maison-eyebrow mb-2">Related Guides</p>
      <h2 className="maison-display text-2xl text-[var(--maison-ink)] mb-2">
        More Stories
      </h2>
      <p className="text-sm text-[var(--maison-muted)] mb-6">
        함께 읽어보면 좋은 안내 {links.length}개 — 좌우로 스크롤하세요
      </p>
      <div className="relative -mx-1">
        <div className="flex gap-4 overflow-x-auto pb-3 px-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]">
          {links.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="snap-start shrink-0 w-[200px] sm:w-[220px] maison-soft-block rounded-[1.35rem] overflow-hidden hover:-translate-y-0.5 transition-transform duration-300"
              title={item.keyword}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.keyword}
                    fill
                    className="object-cover object-center"
                    sizes="220px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--maison-mist)]" />
                )}
              </div>
              <div className="px-3.5 py-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--maison-gold)] mb-1">
                  Guide
                </p>
                <p className="text-sm font-medium text-[var(--maison-ink)] line-clamp-2 leading-snug">
                  {item.keyword}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
