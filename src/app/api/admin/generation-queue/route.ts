import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  enqueueGenerationKeywords,
  getGenerationJobsForAdmin,
  getGenerationQueueSummary,
  getPendingGenerationKeywordsText,
  getRecentGenerationJobs,
  replacePendingGenerationKeywords,
  type GenerationJobStatus,
} from "@/lib/generation-queue";
import { parseKeywordList, MAX_BULK_KEYWORDS } from "@/lib/parse-keywords";
import { getServicePeriodStatus } from "@/lib/service-period";

const ADMIN_JOB_STATUSES = new Set<GenerationJobStatus | "all">([
  "all",
  "pending",
  "processing",
  "completed",
  "failed",
]);

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const download = req.nextUrl.searchParams.get("download");
  if (download === "txt") {
    const text = await getPendingGenerationKeywordsText();
    const filename = `generation-queue-pending-${new Date().toISOString().slice(0, 10)}.txt`;
    return new NextResponse(text || "", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const statusParam = req.nextUrl.searchParams.get("status") || "all";
  const status = ADMIN_JOB_STATUSES.has(statusParam as GenerationJobStatus | "all")
    ? (statusParam as GenerationJobStatus | "all")
    : "all";

  const [summary, recent, pendingText, queueResult] = await Promise.all([
    getGenerationQueueSummary(),
    getRecentGenerationJobs(50),
    getPendingGenerationKeywordsText(),
    getGenerationJobsForAdmin(status, 5000),
  ]);

  return NextResponse.json(
    {
      summary,
      recent,
      pendingText,
      jobs: queueResult.jobs,
      scope: queueResult.scope,
      statusFilter: status,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await getServicePeriodStatus();
  if (!service.active) {
    return NextResponse.json(
      { error: "사용 기간이 만료되었습니다. 마스터 설정에서 기간 연장 후 다시 시도하세요." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  let keywords: string[] = [];

  if (Array.isArray(body.keywords)) {
    keywords = body.keywords.map((k: unknown) => String(k).trim()).filter(Boolean);
  } else if (typeof body.text === "string") {
    keywords = parseKeywordList(body.text);
  } else {
    return NextResponse.json(
      { error: "keywords 배열 또는 text 문자열을 보내주세요." },
      { status: 400 }
    );
  }

  if (keywords.length === 0) {
    return NextResponse.json({ error: "등록할 키워드가 없습니다." }, { status: 400 });
  }

  if (keywords.length > MAX_BULK_KEYWORDS) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_BULK_KEYWORDS}개까지 등록할 수 있습니다.` },
      { status: 400 }
    );
  }

  const result = await enqueueGenerationKeywords(keywords);

  const siteLabel = result.scope.isTenant
    ? ` (${result.scope.subdomain})`
    : "";

  return NextResponse.json({
    success: true,
    added: result.added,
    skipped: result.skipped,
    skippedReasons: result.skippedReasons,
    scope: result.scope,
    message:
      result.added > 0
        ? `${result.added}개 키워드를 VM 생성 대기열${siteLabel}에 등록했습니다. VM이 순서대로 1개씩 생성합니다.`
        : "등록된 키워드가 없습니다. (중복 또는 이미 존재)",
  });
}

/** 대기(pending) 키워드 목록 전체 교체 — TXT 편집 후 저장용 */
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await getServicePeriodStatus();
  if (!service.active) {
    return NextResponse.json(
      { error: "사용 기간이 만료되었습니다. 마스터 설정에서 기간 연장 후 다시 시도하세요." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  let keywords: string[] = [];

  if (Array.isArray(body.keywords)) {
    keywords = body.keywords.map((k: unknown) => String(k).trim()).filter(Boolean);
  } else if (typeof body.text === "string") {
    keywords = parseKeywordList(body.text);
  } else {
    return NextResponse.json(
      { error: "keywords 배열 또는 text 문자열을 보내주세요." },
      { status: 400 }
    );
  }

  if (keywords.length > MAX_BULK_KEYWORDS) {
    return NextResponse.json(
      { error: `대기열은 최대 ${MAX_BULK_KEYWORDS}개까지 저장할 수 있습니다.` },
      { status: 400 }
    );
  }

  const result = await replacePendingGenerationKeywords(keywords);

  const siteLabel = result.scope.isTenant
    ? ` (${result.scope.subdomain})`
    : "";

  return NextResponse.json({
    success: true,
    replaced: result.replaced,
    skipped: result.skipped,
    skippedReasons: result.skippedReasons,
    scope: result.scope,
    message:
      result.replaced > 0
        ? `대기열${siteLabel}을 ${result.replaced}개 키워드로 저장했습니다.`
        : "대기열이 비워졌습니다.",
  });
}
