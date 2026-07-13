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
import { DEFAULT_SITE_DESIGN } from "@/lib/site-designs";
import { getLegacySiteConfig } from "@/lib/site-config";
import type { TenantContentData } from "@/types/tenant";

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/**
 * 이미 Vercel에 배포된 사이트를 Supabase 등록 목록에만 편입.
 * - Vercel 도메인 재등록 없음
 * - 현재 사이트(메종드폼스키 M 디자인) 설정 그대로 유지
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

  const legacy = await getLegacySiteConfig();
  const siteName =
    String(body.siteName || "").trim() ||
    legacy.brandName ||
    DEFAULT_SITE_CONFIG.brandName;
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
          "올바른 도메인을 입력해 주세요. (예: ansangoyangibunyang.vercel.app)",
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

    /** 현재 배포 사이트 디자인(M · 메종드폼스키) 그대로 유지 */
    const contentData: TenantContentData = {
      siteDesign: DEFAULT_SITE_DESIGN,
      designVariant: "modern",
      headerStyle: "sticky",
      sectionOrder: [],
      tagline: legacy.tagline || DEFAULT_SITE_CONFIG.tagline,
      description: legacy.description || DEFAULT_SITE_CONFIG.description,
      keywords:
        "폼스키,메종드폼스키,폼스키분양,Pomsky,Maison de Pomsky",
      heroHeadline: siteName,
      heroSubcopy:
        legacy.tagline ||
        "포메라니안과 시베리안 허스키가 만나 태어난 하이브리드견 — 품격 있는 분양을 안내합니다.",
      heroBadge: "Maison de Pomsky",
      aboutText: legacy.description || DEFAULT_SITE_CONFIG.description,
      exposureMode: legacy.exposureMode || DEFAULT_SITE_CONFIG.exposureMode,
    };

    const row = await insertTenantSiteConfig({
      site_name: siteName,
      subdomain,
      theme_color: {
        ...DEFAULT_BRAND_THEME,
        primary: "#b08d6a",
        secondary: "#d4b896",
        dark: "#2c2622",
        darkLight: "#3d3530",
        cream: "#f7f3ef",
      },
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
      siteDesign: DEFAULT_SITE_DESIGN,
      message: `기존 사이트를 등록 목록에 편입했습니다. (메종드폼스키 M 디자인 유지, Vercel 재배포 없음) ${siteUrl}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "편입 중 알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
