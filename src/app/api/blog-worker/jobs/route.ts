import { NextRequest, NextResponse } from "next/server";
import { verifyWorkerRequest } from "@/lib/collection-queue";
import {
  claimBlogJobs,
  getPendingBlogJobsForNaverId,
  reportBlogJobResults,
} from "@/lib/blog-writing";

export const dynamic = "force-dynamic";

/**
 * VM 블로그 자동작성 — 대기 작업 조회
 * GET /api/blog-worker/jobs?naverId={사이트등록시_네이버아이디}
 * Authorization: Bearer {COLLECTION_WORKER_SECRET}
 *
 * 해당 네이버 아이디가 연결된 사이트의 오늘 발행분(하루개수)만 반환합니다.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyWorkerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const naverId = request.nextUrl.searchParams.get("naverId")?.trim() || "";
  if (!naverId) {
    return NextResponse.json({ error: "naverId 쿼리 필요" }, { status: 400 });
  }

  const jobs = await getPendingBlogJobsForNaverId(naverId);

  return NextResponse.json({
    naverId,
    count: jobs.length,
    jobs,
  });
}

/**
 * VM 결과 보고 / 클레임
 * POST body:
 *  - { action: "claim", ids: string[] }
 *  - { results: [{ id, status: "completed"|"failed", error?, postUrl? }] }
 */
export async function POST(request: NextRequest) {
  if (!(await verifyWorkerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === "claim" && Array.isArray(body.ids)) {
    const updated = await claimBlogJobs(
      body.ids.filter((id: unknown) => typeof id === "string")
    );
    return NextResponse.json({ ok: true, updated });
  }

  const results = body.results as
    | { id: string; status: "completed" | "failed"; error?: string; postUrl?: string }[]
    | undefined;

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: "results 배열 또는 action:claim + ids 필요" },
      { status: 400 }
    );
  }

  const updated = await reportBlogJobResults(results);
  return NextResponse.json({ ok: true, updated });
}
