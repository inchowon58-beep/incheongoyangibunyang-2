import Image from "next/image";
import Link from "next/link";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { MAISON_PROMISES } from "@/lib/maison-content";

export default async function AboutMaison() {
  const site = await getSiteConfig();
  const kakao = site.kakaoUrl?.trim();

  return (
    <section id="maison" className="maison-section py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] maison-promo">
          <Image
            src={getImageUrl(22, site)}
            alt="메종드꼬똥"
            fill
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--maison-ink)]/92 via-[var(--maison-ink)]/85 to-[var(--maison-ink)]/70" />

          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-14 sm:py-20">
            <p className="maison-eyebrow text-[var(--maison-gold-soft)] mb-4">
              Why Maison de Coton
            </p>
            <h2 className="maison-display text-[clamp(1.8rem,4vw,3rem)] text-white mb-4 max-w-2xl leading-snug">
              품격을 아는 이들을 위한
              <br />
              꼬똥드툴레아 하우스
            </h2>
            <p className="text-white/75 max-w-xl leading-relaxed mb-12">
              메종드꼬똥은 단순한 분양처가 아닙니다. 품종의 역사를 이해하고, 가정에 맞는
              인연을 잇는 프라이빗 컨설팅에 가깝습니다.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {MAISON_PROMISES.map((p) => (
                <div key={p.num} className="rounded-3xl bg-white/5 border border-white/10 p-6">
                  <p className="text-[var(--maison-gold-soft)] text-xs tracking-[0.3em] mb-3">
                    {p.num}
                  </p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-1">
                    {p.en}
                  </p>
                  <h3 className="text-white font-medium mb-2">{p.ko}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {kakao ? (
                <a
                  href={kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maison-btn-light"
                >
                  카톡으로 상담하기
                </a>
              ) : (
                <Link href="/#contact" className="maison-btn-light">
                  Private Consultation
                </Link>
              )}
              <Link href="/#reviews" className="maison-btn-ghost">
                Family Stories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
