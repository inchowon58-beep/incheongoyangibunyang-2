import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";
import { BREED_TRAITS } from "@/lib/maison-content";

export default async function BreedMaison() {
  const site = await getSiteConfig();

  return (
    <section id="breed" className="maison-section py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="maison-media relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image
                src={getImageUrl(6, site)}
                alt="폼스키 품종 소개"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <p className="maison-eyebrow mb-4">The Breed</p>
            <h2 className="maison-display text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--maison-ink)] mb-5 leading-snug">
              폼스키,
              <br />
              <em className="not-italic text-[var(--maison-gold)]">Pomsky</em>
            </h2>
            <p className="text-[var(--maison-muted)] leading-relaxed mb-10 max-w-xl">
              포메라니안과 시베리안 허스키의 교배로 태어난 하이브리드견입니다. 작은 체구에
              허스키의 마스크와 눈매, 포메라니안의 풍성한 코트가 어우러져 전 세계 애호가에게
              사랑받아 온 품종이에요. 메종드폼스키는 이 본질을 지키며 소개합니다.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {BREED_TRAITS.map((item) => (
                <article key={item.en} className="maison-soft-block p-5 sm:p-6">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--maison-gold)] mb-2">
                    {item.en}
                  </p>
                  <h3 className="text-base text-[var(--maison-ink)] mb-2 font-medium">{item.ko}</h3>
                  <p className="text-sm text-[var(--maison-muted)] leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
