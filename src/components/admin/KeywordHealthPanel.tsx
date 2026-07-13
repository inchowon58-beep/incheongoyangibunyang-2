"use client";

import { useState } from "react";
import Link from "next/link";
import { guidePageUrl } from "@/lib/constants";
import {
  formatRankDisplay,
  formatVolume,
  type HealthStatus,
  type KeywordHealthRow,
} from "@/lib/keyword-health";

interface HealthResponse {
  rows: KeywordHealthRow[];
  counts: {
    total: number;
    success: number;
    opportunity: number;
    watch: number;
  };
  lastUpdated: string | null;
  hasNaverApi: boolean;
  siteUrl: string;
  ranCheck: boolean;
  checked?: number;
  errors?: string[];
  message?: string;
  error?: string;
}

interface Props {
  disabled?: boolean;
  onMessage: (msg: string) => void;
  onRepostDone?: () => void;
}

function StatusDot({ status }: { status: HealthStatus }) {
  const color =
    status === "success"
      ? "bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.25)]"
      : status === "opportunity"
        ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]"
        : "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} aria-hidden />;
}

export default function KeywordHealthPanel({ disabled, onMessage, onRepostDone }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<HealthResponse | null>(null);
  const [repostingId, setRepostingId] = useState<string | null>(null);

  async function runAnalysis() {
    if (analyzing || disabled) return;
    setAnalyzing(true);
    onMessage("발행 키워드를 네이버에서 검색해 노출 여부를 점검 중입니다...");
    try {
      const res = await fetch("/api/admin/keyword-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as HealthResponse;
      if (!res.ok) {
        onMessage(data.error || "키워드 건강검진에 실패했습니다.");
        setAnalyzing(false);
        return;
      }
      setReport(data);
      onMessage(
        data.message ||
          `분석 완료 · 기회 ${data.counts.opportunity}건 / 성공 ${data.counts.success}건`
      );
    } catch {
      onMessage("키워드 건강검진 중 오류가 발생했습니다.");
    }
    setAnalyzing(false);
  }

  async function handleRepost(row: KeywordHealthRow) {
    if (repostingId) return;
    const ok = window.confirm(
      `"${row.keyword}" 본문을 1,500자 이상으로 보강해 재발행할까요?\n(일일 SEO 생성 한도를 1회 사용합니다.)`
    );
    if (!ok) return;

    setRepostingId(row.pageId);
    onMessage(`"${row.keyword}" 재포스팅 AI 생성 중...`);
    try {
      const res = await fetch("/api/admin/keyword-repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: row.pageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onMessage(data.message || "재포스팅이 완료되었습니다.");
        onRepostDone?.();
      } else {
        onMessage(data.error || "재포스팅에 실패했습니다.");
      }
    } catch {
      onMessage("재포스팅 중 오류가 발생했습니다.");
    }
    setRepostingId(null);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sky-600 mb-1">
            Exposure Tracker
          </p>
          <h2 className="font-bold text-dark text-base">마이 키워드 건강검진</h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            발행한 키워드를 네이버에서 검색해, 검색량은 있는데 노출이 약한 기회를 찾아줍니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={analyzing || disabled}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sm shadow-sky-600/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <span
                className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                aria-hidden
              />
              분석 중...
            </>
          ) : (
            <>AI 키워드 분석 시작</>
          )}
        </button>
      </div>

      {analyzing && (
        <div className="px-6 pb-5">
          <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-6 text-center">
            <div className="mx-auto mb-3 w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-sky-900">노출 추적 리포트 작성 중</p>
            <p className="text-xs text-sky-700/80 mt-1">
              키워드마다 네이버 웹문서를 조회합니다. 페이지가 많으면 1~2분 걸릴 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {!analyzing && report && (
        <div className="border-t border-gray-100">
          <div className="px-6 py-3 flex flex-wrap gap-3 text-xs bg-slate-50/80">
            <span className="inline-flex items-center gap-1.5 text-sky-700 font-medium">
              <StatusDot status="success" /> 성공 {report.counts.success}
            </span>
            <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
              <StatusDot status="opportunity" /> 기회 {report.counts.opportunity}
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
              <StatusDot status="watch" /> 관찰 {report.counts.watch}
            </span>
            {report.siteUrl && (
              <span className="text-gray-400 ml-auto truncate max-w-[220px]" title={report.siteUrl}>
                추적 도메인 · {report.siteUrl.replace(/^https?:\/\//, "")}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium w-10">상태</th>
                  <th className="px-3 py-2.5 font-medium">키워드</th>
                  <th className="px-3 py-2.5 font-medium whitespace-nowrap">추정 검색량</th>
                  <th className="px-3 py-2.5 font-medium whitespace-nowrap">현재 순위</th>
                  <th className="px-3 py-2.5 font-medium min-w-[200px]">처방전</th>
                  <th className="px-3 py-2.5 font-medium text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr
                    key={row.pageId}
                    className={`border-t border-gray-50 ${
                      row.status === "opportunity" ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <StatusDot status={row.status} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-dark text-sm leading-snug">{row.keyword}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{row.statusLabel}</p>
                    </td>
                    <td className="px-3 py-3 align-top whitespace-nowrap text-gray-700">
                      {formatVolume(row.monthlyVolume)}
                      <span className="text-[10px] text-gray-400 ml-1">/월</span>
                    </td>
                    <td className="px-3 py-3 align-top whitespace-nowrap text-gray-700">
                      {formatRankDisplay(row.rank)}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-gray-500 leading-relaxed">
                      {row.prescription}
                    </td>
                    <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex flex-col sm:flex-row gap-1.5 items-end sm:items-center justify-end">
                        <Link
                          href={guidePageUrl(row.slug)}
                          target="_blank"
                          className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                        >
                          보기
                        </Link>
                        {row.status === "opportunity" && (
                          <button
                            type="button"
                            onClick={() => void handleRepost(row)}
                            disabled={repostingId === row.pageId}
                            className="text-xs px-2.5 py-1.5 rounded-md font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60"
                          >
                            {repostingId === row.pageId ? "생성 중..." : "재포스팅 AI 생성"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {report.rows.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">
              분석할 발행 키워드가 없습니다. 먼저 SEO 페이지를 생성하세요.
            </p>
          )}

          <p className="px-6 py-3 text-[11px] text-gray-400 border-t border-gray-100">
            검색량은 키워드 의도 기반 추정값입니다. 실제 네이버 검색광고 API 연동 시 교체할 수
            있습니다.
            {report.errors && report.errors.length > 0
              ? ` · 점검 오류 ${report.errors.length}건`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
