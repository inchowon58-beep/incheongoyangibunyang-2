import Link from "next/link";
import type { NearbyRegionLink } from "@/lib/nearby-regions";

interface Props {
  cityLabel: string | null;
  regions: NearbyRegionLink[];
}

export default function NearbyRegionsSection({ cityLabel, regions }: Props) {
  if (regions.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[var(--maison-line)]">
      <p className="maison-eyebrow mb-2">Nearby Areas</p>
      <h2 className="maison-display text-2xl text-[var(--maison-ink)] mb-2">
        근방지역에서도 많이 알아보셨네요
      </h2>
      <p className="text-sm text-[var(--maison-muted)] mb-6">
        {cityLabel
          ? `${cityLabel} 인근 구·동 단위로 함께 찾아보시는 분들이 많습니다.`
          : "인근 구·동 단위로 함께 찾아보시는 분들이 많습니다."}
      </p>
      <ul className="flex flex-wrap gap-2.5">
        {regions.map((item) => (
          <li key={item.region}>
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center px-4 py-2.5 rounded-full border border-[var(--maison-line)] bg-[var(--maison-card)] text-sm font-medium text-[var(--maison-ink)] hover:border-[var(--maison-gold)] hover:text-[var(--maison-gold)] transition"
              >
                {item.region}
              </Link>
            ) : (
              <span className="inline-flex items-center px-4 py-2.5 rounded-full border border-[var(--maison-line)] bg-[var(--maison-mist)] text-sm font-medium text-[var(--maison-muted)]">
                {item.region}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
