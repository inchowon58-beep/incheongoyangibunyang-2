import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  classifyKeywordHealth,
  estimateMonthlyVolume,
  type KeywordHealthRow,
} from "@/lib/keyword-health";
import {
  getAllRankingSummaries,
  runAllRankingChecks,
} from "@/lib/seo-ranking";
import { getSiteConfig } from "@/lib/site-config";

export const maxDuration = 300;

function buildRows(
  summaries: Awaited<ReturnType<typeof getAllRankingSummaries>>["summaries"]
): KeywordHealthRow[] {
  return summaries
    .map((s) => {
      const monthlyVolume = estimateMonthlyVolume(s.keyword);
      const classified = classifyKeywordHealth(s.rank, monthlyVolume);
      return {
        pageId: s.pageId,
        keyword: s.keyword,
        slug: s.slug,
        rank: s.rank,
        monthlyVolume,
        volumeEstimated: true,
        status: classified.status,
        statusLabel: classified.statusLabel,
        prescription: classified.prescription,
        checkedAt: s.checkedAt,
      } satisfies KeywordHealthRow;
    })
    .sort((a, b) => {
      const order = { opportunity: 0, watch: 1, success: 2 } as const;
      const diff = order[a.status] - order[b.status];
      if (diff !== 0) return diff;
      return b.monthlyVolume - a.monthlyVolume;
    });
}

function summarize(rows: KeywordHealthRow[]) {
  return {
    total: rows.length,
    success: rows.filter((r) => r.status === "success").length,
    opportunity: rows.filter((r) => r.status === "opportunity").length,
    watch: rows.filter((r) => r.status === "watch").length,
  };
}

/** 저장된 최근 순위 기준으로 리포트만 조회 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ranking, config] = await Promise.all([
    getAllRankingSummaries(),
    getSiteConfig(),
  ]);
  const rows = buildRows(ranking.summaries);

  return NextResponse.json({
    rows,
    counts: summarize(rows),
    lastUpdated: ranking.lastUpdated,
    hasNaverApi: ranking.hasNaverApi,
    siteUrl: config.url || process.env.SITE_URL || "",
    ranCheck: false,
  });
}

/** 네이버 웹검색으로 전 키워드 노출 점검 후 건강검진 리포트 반환 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = await runAllRankingChecks();
  if (check.checked === 0 && check.errors.length > 0) {
    return NextResponse.json(
      {
        error: check.errors[0] || "노출 점검에 실패했습니다.",
        errors: check.errors,
      },
      { status: 400 }
    );
  }

  const [ranking, config] = await Promise.all([
    getAllRankingSummaries(),
    getSiteConfig(),
  ]);
  const rows = buildRows(ranking.summaries);

  return NextResponse.json({
    rows,
    counts: summarize(rows),
    lastUpdated: ranking.lastUpdated,
    hasNaverApi: ranking.hasNaverApi,
    siteUrl: config.url || process.env.SITE_URL || "",
    ranCheck: true,
    checked: check.checked,
    skipped: check.skipped,
    errors: check.errors,
    message: `키워드 ${check.checked}건 노출 점검 완료` +
      (check.errors.length ? ` (오류 ${check.errors.length}건)` : ""),
  });
}
