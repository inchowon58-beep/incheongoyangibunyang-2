import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { DataStorageError } from "@/lib/data";
import { regenerateSeoPage, SeoCreateError } from "@/lib/seo-page-create";

export const maxDuration = 120;

/** 기회(빨간불) 키워드 본문 AI 재포스팅 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
  if (!pageId) {
    return NextResponse.json({ error: "pageId가 필요합니다." }, { status: 400 });
  }

  try {
    const { page, collectionEnqueued, tenantId } = await regenerateSeoPage(pageId);
    return NextResponse.json({
      ok: true,
      page,
      collectionEnqueued,
      tenantId,
      message: collectionEnqueued
        ? `"${page.keyword}" 본문을 보강해 재발행했고, 순위반영 대기열에도 등록했습니다.`
        : `"${page.keyword}" 본문을 보강해 재발행했습니다.`,
    });
  } catch (error) {
    if (error instanceof SeoCreateError) {
      const status =
        error.code === "QUOTA" ? 429 : error.code === "SERVICE" ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof DataStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("keyword repost failed:", error);
    return NextResponse.json(
      { error: "재포스팅 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
