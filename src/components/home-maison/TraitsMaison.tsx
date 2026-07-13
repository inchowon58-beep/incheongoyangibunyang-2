import { SIZE_FACTS } from "@/lib/maison-content";

export default function TraitsMaison() {
  return (
    <section id="traits" className="maison-section py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="maison-eyebrow mb-4">Size & Character</p>
          <h2 className="maison-display text-[clamp(1.75rem,4vw,2.6rem)] text-[var(--maison-ink)] mb-4">
            크기와 성격의 매력
          </h2>
          <p className="text-[var(--maison-muted)] leading-relaxed">
            작은 체구에 담긴 활기와 애착. 폼스키는 실내 생활과 함께하는 산책·놀이에 잘 맞는
            하이브리드 컴패니언입니다.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16">
          {SIZE_FACTS.map((fact) => (
            <div
              key={fact.label}
              className="maison-soft-block text-center px-4 py-8 rounded-[1.75rem]"
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--maison-gold)] mb-3">
                {fact.label}
              </p>
              <p className="maison-display text-xl sm:text-2xl text-[var(--maison-ink)] mb-2">
                {fact.value}
              </p>
              <p className="text-xs text-[var(--maison-muted)]">{fact.note}</p>
            </div>
          ))}
        </div>

        <div className="maison-soft-block rounded-[2rem] p-8 sm:p-12 max-w-4xl mx-auto">
          <p className="maison-eyebrow mb-3">Temperament</p>
          <h3 className="maison-display text-2xl text-[var(--maison-ink)] mb-5">
            사람을 향한 활기찬 충성
          </h3>
          <div className="space-y-4 text-[var(--maison-muted)] leading-relaxed">
            <p>
              폼스키는 애교와 호기심이 많으며, 가족을 &ldquo;자신의 무리&rdquo;로 여기는 성향이
              강합니다. 개체에 따라 활동량과 독립심에 차이가 있어, 이른 사회화와 꾸준한
              훈련·스킨십이 더 안정된 성격을 만듭니다.
            </p>
            <p>
              똑똑하고 표현력이 풍부해 기초 훈련에 잘 반응합니다. 함께 걷고 노는 시간을
              즐기므로, 산책이 가능한 가정·활기찬 라이프스타일과 잘 어울립니다. 메종드폼스키는
              가정 환경에 맞는 기질의 아이를 상담을 통해 매칭합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
