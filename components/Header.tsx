"use client";

import { useEffect, useState } from "react";

const navItems = [
  { href: "#about", label: "소개" },
  { href: "#services", label: "보호 서비스" },
  { href: "#process", label: "파양 절차" },
  { href: "#shelter", label: "보호소 안내" },
  { href: "#faq", label: "문의" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <a href="#" className="group min-w-0 shrink">
          <span className="block truncate font-serif text-base font-medium text-charcoal sm:text-lg">
            일산강아지파양
          </span>
          <span className="block truncate text-[10px] font-medium uppercase tracking-widest text-warm">
            Ilsan Shelter Guide
          </span>
        </a>

        <nav aria-label="주요 메뉴" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-warm transition hover:text-charcoal"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="tel:0505-707-0401"
            className="hidden rounded-full border border-sand px-4 py-2 text-sm font-medium text-charcoal transition hover:border-charcoal lg:inline-flex"
          >
            0505-707-0401
          </a>

          <button
            type="button"
            className="inline-flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg border border-sand bg-cream lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={`block h-[2px] w-5 rounded-full bg-charcoal transition-transform duration-200 ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-charcoal transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-charcoal transition-transform duration-200 ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-charcoal/40 lg:hidden"
          aria-label="메뉴 닫기"
          onClick={closeMenu}
        />
      )}

      <nav
        id="mobile-menu"
        aria-label="모바일 메뉴"
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(18rem,85vw)] flex-col border-l border-sand bg-cream shadow-xl transition-transform duration-200 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sand/60 px-4 py-4">
          <span className="text-sm font-medium text-charcoal">메뉴</span>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-charcoal"
            aria-label="메뉴 닫기"
            onClick={closeMenu}
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block rounded-lg px-4 py-3 text-base text-charcoal transition hover:bg-cream-dark"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="border-t border-sand/60 p-4">
          <a
            href="tel:0505-707-0401"
            className="flex w-full items-center justify-center rounded-full bg-charcoal px-4 py-3 text-sm font-semibold text-cream"
            onClick={closeMenu}
          >
            전화하기
          </a>
        </div>
      </nav>
    </header>
  );
}
