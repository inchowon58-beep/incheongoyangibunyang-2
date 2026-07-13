import Image from "next/image";
import { getSiteConfig } from "@/lib/site-config";
import { getImageUrl } from "@/lib/site-images";

export default async function HistoryMaison() {
  const site = await getSiteConfig();

  return (
    <section id="history" className="maison-section maison-section-mist py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="maison-eyebrow mb-4">Heritage</p>
            <h2 className="maison-display text-[clamp(1.75rem,4vw,2.6rem)] text-[var(--maison-ink)] mb-6 leading-snug">
              두 품종이 만나
              <br />
              태어난 이야기
            </h2>
            <div className="space-y-5 text-[var(--maison-muted)] leading-relaxed">
              <p>
                폼스키(Pomsky)는 포메라니안(Pomeranian)과 시베리안 허스키(Siberian Husky)의
                이름을 합쳐 부른 하이브리드견입니다. 허스키의 늑대 같은 외모와 포메라니안의
                작은 체구를 함께 담고 싶어 한 애호가들 사이에서 주목받기 시작했습니다.
              </p>
              <p>
                일반적으로 인공수정을 통해 교배가 이루어지며, 세대(F1·F2·F3 등)에 따라 크기와
                외모·기질에 차이가 있습니다. 그 다양성 자체가 폼스키만의 매력이자, 분양 전
                신중한 상담이 필요한 이유이기도 합니다.
              </p>
              <p>
                오늘날 폼스키는 미니 허스키 분위기의 컴패니언으로 사랑받고 있습니다.
                메종드폼스키는 이 하이브리드의 특성을 존중하며, 건강한 기질과 아름다운 외모를
                갖춘 개체만을 신중히 소개합니다.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="maison-media relative aspect-[5/6] overflow-hidden rounded-[2.25rem]">
              <Image
                src={getImageUrl(10, site)}
                alt="폼스키 역사"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <p className="mt-5 text-center text-xs tracking-[0.2em] uppercase text-[var(--maison-muted)]">
              Pomeranian × Siberian Husky
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
