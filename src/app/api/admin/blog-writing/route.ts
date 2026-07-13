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
      await ensureTodayBlogJobs(config.siteKey);
    }

    const refreshed = await getPublicBlogWritingConfig();
    return NextResponse.json({
      ok: true,
      config: refreshed,
      message: "블로그 작성 설정을 저장했습니다.",
    });
  } catch (error) {
    if (error instanceof DataStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("blog-writing PUT failed:", error);
    return NextResponse.json({ error: "설정 저장 실패" }, { status: 500 });
  }
}
