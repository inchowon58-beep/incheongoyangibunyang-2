import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  ensureTodayBlogJobs,
  getPublicBlogWritingConfig,
  saveBlogWritingConfig,
  type BlogPublishMode,
  type BlogWritingStyle,
} from "@/lib/blog-writing";
import { DataStorageError } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getPublicBlogWritingConfig();
    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof DataStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("blog-writing GET failed:", error);
    return NextResponse.json({ error: "설정 조회 실패" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const config = await saveBlogWritingConfig({
      naverId: typeof body.naverId === "string" ? body.naverId : undefined,
      naverPassword:
        typeof body.naverPassword === "string" ? body.naverPassword : undefined,
      clearPassword: body.clearPassword === true,
      basePrompt: typeof body.basePrompt === "string" ? body.basePrompt : undefined,
      writingStyle:
        body.writingStyle === "info" || body.writingStyle === "review"
          ? (body.writingStyle as BlogWritingStyle)
          : undefined,
      dailyCount:
        typeof body.dailyCount === "number"
          ? body.dailyCount
          : typeof body.dailyCount === "string"
            ? Number(body.dailyCount)
            : undefined,
      publishMode:
        body.publishMode === "random" || body.publishMode === "continuous"
          ? (body.publishMode as BlogPublishMode)
          : undefined,
      windowStartHour:
        typeof body.windowStartHour === "number" || typeof body.windowStartHour === "string"
          ? Number(body.windowStartHour)
          : undefined,
      windowEndHour:
        typeof body.windowEndHour === "number" || typeof body.windowEndHour === "string"
          ? Number(body.windowEndHour)
          : undefined,
      imageCdn: typeof body.imageCdn === "string" ? body.imageCdn : undefined,
      imageCount:
        typeof body.imageCount === "number" || typeof body.imageCount === "string"
          ? Number(body.imageCount)
          : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      keywordsText:
        typeof body.keywordsText === "string" ? body.keywordsText : undefined,
      appendKeywords: body.appendKeywords === true,
    });

    if (config.enabled) {
      const created = await ensureTodayBlogJobs(config.siteKey);
      const refreshed = await getPublicBlogWritingConfig();
      return NextResponse.json({
        ok: true,
        config: refreshed,
        jobsCreated: created,
        message:
          created > 0
            ? `블로그 작성 설정을 저장했고, 오늘 발행 job ${created}건을 만들었습니다.`
            : refreshed.keywordQueueCount === 0
              ? "설정은 저장됐지만 키워드가 없어 job을 만들지 못했습니다."
              : refreshed.dailyRemaining <= 0
                ? "설정은 저장됐습니다. 오늘 하루 발행 한도를 이미 모두 사용 중입니다."
                : "설정은 저장됐습니다. (이번 저장에서 새 job은 없음 — 이미 대기 job이 있거나 조건 미충족)",
      });
    }

    const refreshed = await getPublicBlogWritingConfig();
    return NextResponse.json({
      ok: true,
      config: refreshed,
      jobsCreated: 0,
      message: "블로그 작성 설정을 저장했습니다. (발행 사용 OFF — job 미생성)",
    });
  } catch (error) {
    if (error instanceof DataStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("blog-writing PUT failed:", error);
    return NextResponse.json({ error: "설정 저장 실패" }, { status: 500 });
  }
}
