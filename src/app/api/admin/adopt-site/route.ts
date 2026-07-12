import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, isMasterAuthenticated } from "@/lib/auth";
import {
  getSupabaseConfigError,
  insertTenantSiteConfig,
  isSubdomainTaken,
  isSupabaseConfigured,
  normalizeHostname,
} from "@/lib/supabase/tenant-db";
import { DEFAULT_BRAND_THEME } from "@/lib/tenant-theme";
import { fetchNaverAccountById } from "@/lib/supabase/naver-accounts";
import { enqueueNaverSiteRegistration } from "@/lib/naver-register-worker";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-types";
import type { TenantContentData } from "@/types/tenant";

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * 이미 Vercel에 배포된 사이트를 Supabase 등록 목록에만 편입.
 * - Vercel 도메인 재등록 없음
 * - pickTenantContentPackage 없음 → E 디자인(home-re) 유지
 * - 네이버 계정 연결 (슬랙은 선택)
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()) || !(await isMasterAuthenticated())) {
    return NextResponse.json({ error: "마스터 권한이 필요합니다." }, { status: 401 });
  }

  const supabaseError = getSupabaseConfigError();
  if (supabaseError || !isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          supabaseError ||
          "Supabase가 설정되지 않았습니다. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 확인하세요.",
      },
      { status: 503 }
    );
  }

  let body: {
    siteName?: string;
    subdomain?: string;
    slackWebhook?: string;
    naverAccountId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  const siteName =
    String(body.siteName || "").trim() || DEFAULT_SITE_CONFIG.brandName;
  const subdomain = normalizeHostname(String(body.subdomain || "").trim());
  const slackWebhook = String(body.slackWebhook || "").trim();
  const naverAccountId = String(body.naverAccountId || "").trim();

  if (!siteName || siteName.length < 2) {
    return NextResponse.json({ error: "사이트 이름을 입력해 주세요." }, { status: 400 });
  }

  if (!subdomain || !DOMAIN_RE.test(subdomain)) {
    return NextResponse.json(
      {
        error:
          "올바른 도메인을 입력해 주세요. (예: junmo-kappa.vercel.app 또는 jejuzone.yourdogzone.co.kr)",
      },
      { status: 400 }
    );
  }

  if (slackWebhook && !slackWebhook.startsWith("https://hooks.slack.com/")) {
    return NextResponse.json(
      { error: "Slack Webhook URL 형식이 올바르지 않습니다. (https://hooks.slack.com/...)" },
      { status: 400 }
    );
  }

  if (!naverAccountId) {
    return NextResponse.json(
      { error: "네이버 계정을 선택해 주세요." },
      { status: 400 }
    );
  }

  try {
    if (await isSubdomainTaken(subdomain)) {
      return NextResponse.json(
        { error: "이미 등록 목록에 있는 도메인입니다." },
        { status: 409 }
      );
    }

    const account = await fetchNaverAccountById(naverAccountId);
    if (!account || !account.is_active) {
      return NextResponse.json(
        { error: "선택한 네이버 계정을 찾을 수 없거나 비활성입니다." },
        { status: 400 }
      );
    }

    /** 디자인 E만 고정 — 홈(home-re) 레이아웃·문구는 코드에 유지 */
    const contentData: TenantContentData = {
      siteDesign: "e",
      designVariant: "modern",
      headerStyle: "sticky",
      sectionOrder: [],
      tagline: DEFAULT_SITE_CONFIG.tagline,
      description: DEFAULT_SITE_CONFIG.description,
      keywords:
        "제주공인중개사,서귀포공인중개사,양준모공인중개사,태솔부동산,제주부동산",
      heroHeadline: `${siteName} | 공인중개 신뢰 상담`,
      heroSubcopy: "투명한 상담과 지역 밀착 중개",
      heroBadge: "2026 서귀포시 우수공인중개사",
      aboutText: DEFAULT_SITE_CONFIG.description,
    };

    const row = await insertTenantSiteConfig({
      site_name: siteName,
      subdomain,
      theme_color: DEFAULT_BRAND_THEME,
      content_data: contentData,
      naver_verification: null,
      slack_webhook: slackWebhook || null,
      naver_account_id: account.id,
      naver_site_registered_at: null,
      daily_seo_limit: null,
      seo_quota_date: null,
      seo_quota_count: 0,
    });

    await enqueueNaverSiteRegistration({
      siteConfigId: row.id,
      naverAccountId: account.id,
      siteName,
      subdomain,
    });

    const siteUrl = `https://${subdomain}`;

    return NextResponse.json({
      success: true,
      siteId: row.id,
      subdomain,
      siteUrl,
      siteDesign: "e",
      message: `기존 사이트를 등록 목록에 편입했습니다. (E 디자인 유지, Vercel 재배포 없음) ${siteUrl}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "편입 중 알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
