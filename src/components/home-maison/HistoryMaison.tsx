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
              왕실이 품었던
              <br />
              작은 구름의 역사
            </h2>
            <div className="space-y-5 text-[var(--maison-muted)] leading-relaxed">
              <p>
                꼬똥드툴레아의 뿌리는 인도양 마다가스카르의 항구 도시 툴레아르(Tuléar)에 닿아
                있습니다. 유럽 선원과 상인들이 들여온 소형견들이 섬의 귀족 가문과 함께하며,
                오늘날의 우아한 코튼 코트로 다듬어졌다고 전해집니다.
              </p>
              <p>
                한때 마다가스카르 귀족만이 곁에 둘 수 있었던 &ldquo;Royal Dog of
                Madagascar&rdquo;로 불리며, 일반 가정의 반려가 되기까지 긴 시간이 흘렀습니다.
                그 희소성과 품격은 지금도 프리미엄 반려견으로서의 가치를 지킵니다.
              </p>
              <p>
                FCI·AKC 등 국제 켄넬에서 공인된 이후, 전 세계 애호가들에게 사랑받는 소형
                컴패니언으로 자리 잡았습니다. 메종드꼬똥은 이 유산을 존중하며, 건강한 기질과
                아름다운 외모를 갖춘 개체만을 신중히 소개합니다.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="maison-media relative aspect-[5/6] overflow-hidden rounded-[2.25rem]">
              <Image
                src={getImageUrl(10, site)}
                alt="꼬똥드툴레아 역사"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <p className="mt-5 text-center text-xs tracking-[0.2em] uppercase text-[var(--maison-muted)]">
              Royal Dog of Madagascar
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
