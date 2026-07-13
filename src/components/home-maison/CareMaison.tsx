import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { CARE_POINTS } from "@/lib/maison-content";

export default async function CareMaison() {
  const site = await getSiteConfig();

  return (
    <section id="care" className="maison-section maison-section-mist py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <p className="maison-eyebrow mb-4">Coat & Care</p>
            <h2 className="maison-display text-[clamp(1.75rem,4vw,2.5rem)] text-[var(--maison-ink)] mb-5 leading-snug">
              코트부터
              <br />
              일상 케어까지
            </h2>
            <p className="text-[var(--maison-muted)] leading-relaxed mb-8">
              럭셔리한 외모는 올바른 관리에서 이어집니다. 분양 전, 케어의 현실을 함께
              이해하시는 것이 메종드폼스키의 철학입니다.
            </p>
            <div className="maison-media relative aspect-[4/5] overflow-hidden rounded-[2rem] hidden lg:block">
              <Image
                src={getImageUrl(17, site)}
                alt="폼스키 코트 케어"
                fill
                className="object-cover"
                sizes="30vw"
              />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            {CARE_POINTS.map((point, i) => (
              <article
                key={point.en}
                className="maison-soft-block rounded-[1.75rem] p-6 sm:p-8 flex gap-5 sm:gap-8"
              >
                <span className="maison-display text-2xl text-[var(--maison-gold)] shrink-0 w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--maison-gold)] mb-1">
                    {point.en}
                  </p>
                  <h3 className="text-lg text-[var(--maison-ink)] font-medium mb-2">{point.ko}</h3>
                  <p className="text-sm text-[var(--maison-muted)] leading-relaxed">{point.text}</p>
                </div>
              </article>
            ))}

            <div className="maison-media relative aspect-[16/10] overflow-hidden rounded-[2rem] lg:hidden mt-6">
              <Image
                src={getImageUrl(17, site)}
                alt="폼스키 코트 케어"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
