"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NaverAccountSummary, TenantSiteSummary } from "@/types/tenant";
import { siteDesignLabel } from "@/lib/site-designs";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {label} {ok ? "✓" : "—"}
    </span>
  );
}

function NaverIntegrationBadges({
  siteId,
  hasNaverAccount,
  naverSiteRegistered,
  marking,
  onMarkRegistered,
}: {
  siteId: string;
  hasNaverAccount: boolean;
  naverSiteRegistered: boolean;
  marking: boolean;
  onMarkRegistered: (siteId: string) => void;
}) {
  if (!hasNaverAccount && !naverSiteRegistered) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#03c75a]/10 text-[#03a94d]">
        네이버
      </span>
      {naverSiteRegistered ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm">
          등록완료
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onMarkRegistered(siteId)}
          disabled={marking}
          title="클릭하면 등록완료로 표시"
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition disabled:opacity-50"
        >
          {marking ? "처리 중…" : "등록 대기"}
        </button>
      )}
    </div>
  );
}

function defaultAdoptHost(): string {
  if (typeof window === "undefined") return "";
  return window.location.host.replace(/^www\./, "");
}

export default function TenantSitesClient() {
  const [sites, setSites] = useState<TenantSiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingNaverId, setMarkingNaverId] = useState<string | null>(null);

  const [showAdopt, setShowAdopt] = useState(false);
  const [adoptName, setAdoptName] = useState("메종드폼스키");
  const [adoptHost, setAdoptHost] = useState("");
  const [adoptSlack, setAdoptSlack] = useState("");
  const [adoptNaverId, setAdoptNaverId] = useState("");
  const [naverAccounts, setNaverAccounts] = useState<NaverAccountSummary[]>([]);
  const [adopting, setAdopting] = useState(false);

  async function loadSites() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tenants", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/master";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "목록을 불러오지 못했습니다.");
        return;
      }
      setSites(Array.isArray(data.sites) ? data.sites : []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSites();
  }, []);

  useEffect(() => {
    if (!showAdopt) return;
    setAdoptHost((prev) => prev || defaultAdoptHost());
    async function loadAccounts() {
      try {
        const res = await fetch("/api/admin/naver-accounts", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.accounts) ? data.accounts : [];
        setNaverAccounts(list.filter((a: NaverAccountSummary) => a.isActive));
      } catch {
        /* ignore */
      }
    }
    void loadAccounts();
  }, [showAdopt]);

  async function handleDelete(site: TenantSiteSummary) {
    const confirmed = window.confirm(
      `「${site.siteName}」(${site.subdomain})을(를) 등록 목록에서 삭제할까요?\n\n` +
        "· Supabase 사이트 설정·SEO 페이지·대기열이 함께 삭제됩니다.\n" +
        "· Vercel 도메인 연결은 별도입니다. (이미 해제했다면 무시)\n" +
        "· 같은 서브도메인으로 다시 등록할 수 있습니다."
    );
    if (!confirmed) return;

    setDeletingId(site.id);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/admin/tenants/${site.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "삭제에 실패했습니다.");
        return;
      }
      setSites((prev) => prev.filter((s) => s.id !== site.id));
      setMessage(data.message || "삭제되었습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkNaverRegistered(siteId: string) {
    setMarkingNaverId(siteId);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/tenants/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naverSiteRegistered: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "등록완료 처리에 실패했습니다.");
        return;
      }
      setSites((prev) =>
        prev.map((s) => (s.id === siteId ? { ...s, naverSiteRegistered: true } : s))
      );
      setMessage("네이버 등록완료로 표시했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setMarkingNaverId(null);
    }
  }

  async function handleAdopt(e: React.FormEvent) {
    e.preventDefault();
    setAdopting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/adopt-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: adoptName,
          subdomain: adoptHost,
          slackWebhook: adoptSlack,
          naverAccountId: adoptNaverId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "편입에 실패했습니다.");
        return;
      }
      setShowAdopt(false);
      setAdoptSlack("");
      setAdoptNaverId("");
      setMessage(data.message || "등록 목록에 편입되었습니다.");
      await loadSites();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAdopting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange/5 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-orange uppercase tracking-wider mb-1">
              Multi-tenant SaaS
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark">등록 사이트 목록</h1>
            <p className="text-sm text-gray-500 mt-2">
              Supabase에 등록된 서브도메인 사이트를 확인·수정·삭제합니다. 이미 Vercel에 올린
              사이트는 「기존 사이트 편입」으로 디자인 유지한 채 목록에 넣을 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm shrink-0 items-center">
            <button
              type="button"
              onClick={() => setShowAdopt(true)}
              className="text-white bg-dark font-medium px-3 py-1.5 rounded-lg hover:bg-dark-light transition"
            >
              기존 사이트 편입
            </button>
            <Link href="/admin/register" className="text-orange font-medium hover:underline">
              + 신규 등록
            </Link>
            <Link href="/admin/master" className="text-gray-500 hover:underline">
              마스터 설정
            </Link>
            <Link href="/admin" className="text-gray-400 hover:underline">
              관리자
            </Link>
          </div>
        </div>

        {message && (
          <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {showAdopt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
              <button
                type="button"
                onClick={() => setShowAdopt(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-dark mb-1">기존 Vercel 사이트 편입</h2>
              <p className="text-sm text-gray-500 mb-5">
                이미 배포된 <strong>메종드폼스키</strong> 사이트를 등록 목록에만 추가합니다. M
                디자인·홈 화면은 그대로 두고, 네이버 계정을 연결합니다. 슬랙은 선택 사항입니다.
                (Vercel 재배포·도메인 재등록 없음)
              </p>
              <form onSubmit={handleAdopt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사이트명</label>
                  <input
                    value={adoptName}
                    onChange={(e) => setAdoptName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    도메인 (호스트)
                  </label>
                  <input
                    value={adoptHost}
                    onChange={(e) => setAdoptHost(e.target.value)}
                    placeholder="예: ansangoyangibunyang.vercel.app"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange bg-white text-gray-900 font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    실제 접속 도메인과 같아야 슬랙·네이버가 이 사이트에 연결됩니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slack Webhook <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <input
                    value={adoptSlack}
                    onChange={(e) => setAdoptSlack(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">네이버 계정</label>
                  <select
                    value={adoptNaverId}
                    onChange={(e) => setAdoptNaverId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange bg-white text-gray-900"
                    required
                  >
                    <option value="">선택하세요</option>
                    {naverAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label || a.naverId}
                        {a.vmLabel ? ` · ${a.vmLabel}` : ""}
                      </option>
                    ))}
                  </select>
                  {naverAccounts.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      활성 네이버 계정이 없습니다.{" "}
                      <Link href="/admin/naver-accounts" className="underline">
                        네이버 계정 관리
                      </Link>
                      에서 먼저 등록하세요.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdopt(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={adopting || !adoptNaverId}
                    className="flex-1 py-2.5 rounded-xl bg-orange text-white font-bold hover:bg-orange-light disabled:opacity-50"
                  >
                    {adopting ? "편입 중..." : "목록에 편입"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : sites.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">등록된 테넌트 사이트가 없습니다.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdopt(true)}
                  className="inline-flex items-center gap-2 bg-dark text-white font-bold px-5 py-2.5 rounded-xl hover:bg-dark-light transition text-sm"
                >
                  기존 사이트 편입
                </button>
                <Link
                  href="/admin/register"
                  className="inline-flex items-center gap-2 bg-orange text-white font-bold px-5 py-2.5 rounded-xl hover:bg-orange-light transition text-sm"
                >
                  + 신규 등록
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">사이트</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">도메인</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">연동</th>
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell">등록일</th>
                    <th className="px-4 py-3 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-orange/5 transition">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-dark">{site.siteName}</p>
                        <p className="text-xs text-gray-400 mt-0.5 sm:hidden font-mono">
                          {site.subdomain}
                        </p>
                        {site.designVariant && (
                          <span className="text-[10px] text-gray-400 uppercase mt-1 inline-block mr-2">
                            {site.designVariant}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-orange/80 mt-1 inline-block">
                          {siteDesignLabel(site.siteDesign)}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <a
                          href={site.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-orange hover:underline break-all"
                        >
                          {site.subdomain}
                        </a>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge ok={site.hasSlackWebhook} label="Slack" />
                          <NaverIntegrationBadges
                            siteId={site.id}
                            hasNaverAccount={site.hasNaverAccount}
                            naverSiteRegistered={site.naverSiteRegistered}
                            marking={markingNaverId === site.id}
                            onMarkRegistered={handleMarkNaverRegistered}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(site.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/sites/${site.id}`}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-orange rounded-lg hover:bg-orange-light transition"
                          >
                            수정
                          </Link>
                          <a
                            href={`${site.siteUrl}/admin`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-orange/40 transition"
                          >
                            관리자
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(site)}
                            disabled={deletingId === site.id}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {deletingId === site.id ? "삭제 중..." : "삭제"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && sites.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            총 {sites.length}개 사이트 · 네이버 「등록 대기」를 클릭하면 등록완료로 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
