import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { resetBlogWritingJobs } from "@/lib/blog-writing";
import { DataStorageError } from "@/lib/data";

export const dynamic = "force-dynamic";

/** POST — 현재 사이트 발행 job·오늘 한도 초기화 후, 발행 ON이면 오늘 job 재생성 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { removedJobs, config, jobsCreated } = await resetBlogWritingJobs();
    return NextResponse.json({
      ok: true,
      removedJobs,
      jobsCreated,
      config,
      message:
        removedJobs > 0 || jobsCreated > 0
          ? `발행 데이터 초기화 완료 · 삭제 ${removedJobs}건` +
            (jobsCreated > 0 ? ` · 오늘 job ${jobsCreated}건 재생성` : "")
          : "삭제할 발행 job이 없었습니다. (한도는 0으로 리셋됨)",
    });
  } catch (error) {
    if (error instanceof DataStorageError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("blog-writing reset failed:", error);
    return NextResponse.json({ error: "초기화 실패" }, { status: 500 });
  }
}
