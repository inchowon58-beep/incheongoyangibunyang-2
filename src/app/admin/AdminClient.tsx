"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { guidePageUrl } from "@/lib/constants";

interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  createdAt: string;
}

interface SeoQuota {
  limit: number;
  used: number;
  remaining: number;
  isTenant?: boolean;
  subdomain?: string | null;
  today: string;
  service?: {
    daysRemaining: number;
    expiresAt: string | null;
    active: boolean;
    expired: boolean;
  };
}

const LIST_PAGE_SIZE = 10;

export default function AdminClient() {
  const pathname = usePathname();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [keyword, setKeyword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [quota, setQuota] = useState<SeoQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedPageId, setCopiedPageId] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);

  async function loadData() {
    setLoading(true);
    try {
      const [pagesRes, quotaRes, configRes] = await Promise.all([
        fetch("/api/admin/pages", { cache: "no-store" }),
        fetch("/api/admin/seo-quota", { cache: "no-store" }),
        fetch("/api/site-config", { cache: "no-store" }),
      ]);
      if (pagesRes.status === 401) {
        window.location.href = "/";
        return;
      }
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setPages(Array.isArray(pagesData) ? pagesData : pagesData.pages || []);
      }
      if (quotaRes.ok) setQuota(await quotaRes.json());
      if (configRes.ok) {
        const config = await configRes.json();
        setBrandName(config.brandName || "");
      }
    } catch {
      setMessage("데이터 로드 실패");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (pathname === "/admin") {
      void loadData();
    }
  }, [pathname]);

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [pages]);

  const totalListPages = Math.max(1, Math.ceil(sortedPages.length / LIST_PAGE_SIZE));

  const paginatedPages = useMemo(() => {
    const start = (listPage - 1) * LIST_PAGE_SIZE;
    return sortedPages.slice(start, start + LIST_PAGE_SIZE);
  }, [sortedPages, listPage]);

  useEffect(() => {
    if (listPage > totalListPages) {
      setListPage(totalListPages);
    }
  }, [listPage, totalListPages]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalListPages }, (_, i) => i + 1);
  }, [totalListPages]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (quota && quota.remaining <= 0) {
      setMessage("오늘 생성 가능한 SEO 페이지 수량을 모두 사용했습니다.");
      return;
    }
    if (quota?.service && !quota.service.active) {
      setMessage("사용 기간이 만료되어 SEO 페이지를 생성할 수 없습니다.");
      return;
    }
    setGenerating(true);
    setMessage("Gemini AI로 SEO 문서 생성 중...");
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      if (res.ok) {
        const page = await res.json();
        setMessage(`"${page.title}" SEO 페이지가 생성되었습니다.`);
        setKeyword("");
        setListPage(1);
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || "SEO 페이지 생성 실패.");
        if (res.status === 429) loadData();
      }
    } catch {
      setMessage("생성 중 오류가 발생했습니다.");
    }
    setGenerating(false);
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("이 SEO 페이지를 삭제하시겠습니까?")) return;
    await fetch("/api/admin/pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const copySeoLink = async (slug: string, pageId: string) => {
    const url = `${window.location.origin}${guidePageUrl(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPageId(pageId);
      setTimeout(() => setCopiedPageId(null), 2000);
    } catch {
      setMessage("링크 복사에 실패했습니다.");
    }
  };

  function renderPageRow(page: SeoPage) {
    return (
      <div
        key={page.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-dark text-sm">{page.title}</p>
          <p className="text-xs text-gray-400 mt-1 break-all">
            {page.keyword} · {guidePageUrl(page.slug)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href={guidePageUrl(page.slug)}
            target="_blank"
            className="text-xs px-3 py-1.5 border border-dark text-dark rounded-lg"
          >
            보기
          </Link>
          <button
            type="button"
            onClick={() => copySeoLink(page.slug, page.id)}
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            {copiedPageId === page.id ? "복사됨" : "링크복사"}
          </button>
          <button
            onClick={() => handleDeletePage(page.id)}
            className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg"
          >
            삭제
          </button>
        </div>
      </div>
    );
  }

  const serviceActive = !quota?.service || quota.service.active;
  const canGenerate = serviceActive && (!quota || quota.remaining > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">관리자 페이지</h1>
            <p className="text-sm text-gray-500">{brandName || "SEO 페이지 관리"}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/admin/inquiries" className="text-orange font-medium hover:underline">
              견적 문의 DB
            </Link>
            <Link href="/admin/master" className="text-orange font-medium hover:underline">
              ⚙️ 마스터 설정
            </Link>
            <Link href="/" className="text-gray-400 hover:underline">← 메인</Link>
          </div>
        </div>

        {loading && !quota ? (
          <div className="mb-6 rounded-xl px-4 py-3 border border-gray-200 bg-white text-sm text-gray-400">
            사용가능일 · 생성 가능 수량 불러오는 중...
          </div>
        ) : (
          quota && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 border text-sm ${
                serviceActive && quota.remaining > 0
                  ? "bg-white border-gray-200 text-dark"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="font-medium">
                  사용가능일{" "}
                  <span className="text-orange">{quota.service?.daysRemaining ?? 0}일</span>
                  {quota.service?.expiresAt && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      (만료 {quota.service.expiresAt})
                    </span>
                  )}
                  <span className="text-gray-300 mx-2">|</span>
                  오늘 생성 가능{" "}
                  {quota.isTenant && quota.subdomain && (
                    <span className="text-gray-500 font-normal text-xs mr-1">
                      ({quota.subdomain})
                    </span>
                  )}
                  <span className="text-orange">{quota.remaining}개</span>
                  <span className="text-gray-500 font-normal"> / {quota.limit}개</span>
                </p>
              </div>
            </div>
          )
        )}

        {message && (
          <p className="mb-4 text-sm text-dark bg-orange/10 p-3 rounded-xl">{message}</p>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-dark mb-4">SEO 페이지 생성</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">키워드</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 의정부철거업체, 강남 상가철거"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange"
                required
                disabled={!canGenerate}
              />
            </div>
            <button
              type="submit"
              disabled={generating || !canGenerate}
              className="px-8 py-3 bg-orange text-white font-bold rounded-xl hover:bg-orange-light transition disabled:opacity-50 shrink-0"
            >
              {generating ? "AI 생성 중..." : "SEO 페이지 생성"}
            </button>
            {!canGenerate && quota?.service && !quota.service.active && (
              <p className="text-xs text-red-500">
                사용 기간이 만료되었습니다. 마스터 설정에서 기간 연장 후 이용하세요.
              </p>
            )}
            {!canGenerate && serviceActive && quota && quota.remaining <= 0 && (
              <p className="text-xs text-red-500">
                오늘 생성 한도에 도달했습니다. 마스터 설정에서 한도를 조정하거나 내일 다시 시도하세요.
              </p>
            )}
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-4">
            <h2 className="font-bold text-dark">생성된 SEO 페이지 ({pages.length})</h2>
          </div>

          {loading ? (
            <p className="text-gray-400">로딩 중...</p>
          ) : pages.length === 0 ? (
            <p className="text-gray-400">아직 생성된 페이지가 없습니다.</p>
          ) : (
            <>
              <div className="space-y-3">{paginatedPages.map((page) => renderPageRow(page))}</div>

              {totalListPages > 1 && (
                <nav
                  className="flex flex-wrap justify-center items-center gap-1 mt-6 pt-5 border-t border-gray-100"
                  aria-label="SEO 페이지 목록 페이지"
                >
                  <button
                    type="button"
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={listPage === 1}
                    className="min-w-[32px] h-8 px-2 text-xs text-gray-500 hover:text-[#03C75A] disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setListPage(num)}
                      className={`min-w-[32px] h-8 px-2 text-xs font-bold rounded-[3px] transition-colors ${
                        listPage === num
                          ? "bg-[#03C75A] text-white"
                          : "text-gray-600 hover:bg-[#e8f9ef] hover:text-[#03C75A]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
                    disabled={listPage === totalListPages}
                    className="min-w-[32px] h-8 px-2 text-xs text-gray-500 hover:text-[#03C75A] disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    ›
                  </button>
                </nav>
              )}

              <p className="text-center text-[11px] text-gray-400 mt-3">
                {pages.length}개 중 {(listPage - 1) * LIST_PAGE_SIZE + 1}–
                {Math.min(listPage * LIST_PAGE_SIZE, pages.length)}번째 표시 (페이지당{" "}
                {LIST_PAGE_SIZE}개)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
