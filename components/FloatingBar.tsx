export default function FloatingBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sand/80 bg-cream/95 backdrop-blur-md lg:hidden"
      role="complementary"
      aria-label="빠른 연락 바로가기"
    >
      <div className="mx-auto flex max-w-lg gap-2 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        <a
          href="https://www.agapetstory.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center whitespace-nowrap rounded-full border border-sand bg-cream px-3 py-2.5 text-sm font-medium text-charcoal transition hover:border-charcoal"
        >
          공식홈페이지
        </a>
        <a
          href="tel:0505-707-0401"
          className="flex flex-1 items-center justify-center whitespace-nowrap rounded-full bg-charcoal px-3 py-2.5 text-sm font-semibold text-cream transition hover:bg-aga-dark"
        >
          전화하기
        </a>
      </div>
    </div>
  );
}
