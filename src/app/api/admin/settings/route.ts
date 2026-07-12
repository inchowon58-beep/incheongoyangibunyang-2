import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, isMasterAuthenticated } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/data";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-types";
import {
  computeExpiresAtFromDays,
  daysRemainingFromExpiresAt,
} from "@/lib/service-period";
import { resolveExposureMode } from "@/lib/exposure-mode";
import { resolveDailySeoLimit } from "@/lib/seo-quota";
import { resolveSlackWebhookUrl } from "@/lib/slack-notify";
import { syncAllTenantsDailySeoLimit } from "@/lib/supabase/tenant-quota";
import { isSupabaseConfigured } from "@/lib/supabase/tenant-db";

const SITE_FIELDS = [
  "brandName",
  "companyName",
  "tagline",
  "description",
  "url",
  "phone",
  "email",
  "address",
  "businessNumber",
  "representative",
  "imageCdn",
  "imageCount",
  "supportBase",
  "supportExtra",
  "supportMax",
  "naverExposureId",
] as const;

export async function GET() {
  if (!(await isAuthenticated()) || !(await isMasterAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  const merged = { ...DEFAULT_SITE_CONFIG, ...settings };
  return NextResponse.json(
    {
      ...merged,
      geminiApiKey: merged.geminiApiKey ? "••••••••" : "",
      naverClientId: merged.naverClientId ? "••••••••" : "",
      naverClientSecret: merged.naverClientSecret ? "••••••••" : "",
      naverExposurePassword: merged.naverExposurePassword || "",
      hasApiKey: !!merged.geminiApiKey,
      hasNaverApi: !!(merged.naverClientId && merged.naverClientSecret),
      hasNaverExposurePassword: !!merged.naverExposurePassword,
      serviceExpiresAt: merged.serviceExpiresAt || "",
      serviceDaysRemaining: daysRemainingFromExpiresAt(merged.serviceExpiresAt),
      collectionSiteUrl: settings.collectionSiteUrl?.trim() || merged.url || "",
      hasCollectionWorkerSecret: !!(
        settings.collectionWorkerSecret || process.env.COLLECTION_WORKER_SECRET
      ),
      hasSlackWebhook: !!resolveSlackWebhookUrl(settings),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated()) || !(await isMasterAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updated = { ...(await getSettings()) };

  for (const key of SITE_FIELDS) {
    if (body[key] !== undefined && body[key] !== null) {
      if (key === "imageCount") {
        updated.imageCount = Math.max(1, parseInt(String(body.imageCount), 10) || 20);
      } else {
        (updated as Record<string, unknown>)[key] = String(body[key]).trim();
      }
    }
  }

  if (body.dailySeoLimit !== undefined && body.dailySeoLimit !== null) {
    const parsed = Number.parseInt(String(body.dailySeoLimit), 10);
    updated.dailySeoLimit = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  if (body.serviceAvailableDays !== undefined && body.serviceAvailableDays !== null) {
    const days = Math.max(0, parseInt(String(body.serviceAvailableDays), 10) || 0);
    updated.serviceAvailableDays = days;
    updated.serviceExpiresAt = computeExpiresAtFromDays(days);
  }

  if (body.geminiApiKey && body.geminiApiKey !== "••••••••") {
    updated.geminiApiKey = body.geminiApiKey;
  }
  if (body.naverClientId && body.naverClientId !== "••••••••") {
    updated.naverClientId = body.naverClientId;
  }
  if (body.naverClientSecret && body.naverClientSecret !== "••••••••") {
    updated.naverClientSecret = body.naverClientSecret;
  }
  if (body.naverExposurePassword && body.naverExposurePassword !== "••••••••") {
    updated.naverExposurePassword = body.naverExposurePassword;
  }
  if (body.collectionSiteUrl !== undefined && body.collectionSiteUrl !== null) {
    updated.collectionSiteUrl = String(body.collectionSiteUrl).trim();
  }
  if (body.collectionWorkerSecret && body.collectionWorkerSecret !== "••••••••") {
    updated.collectionWorkerSecret = body.collectionWorkerSecret;
  }
  if (body.slackWebhookUrl !== undefined && body.slackWebhookUrl !== null) {
    const url = String(body.slackWebhookUrl).trim();
    if (!url) {
      updated.slackWebhookUrl = "";
    } else if (url !== "••••••••" && url.startsWith("https://hooks.slack.com/")) {
      updated.slackWebhookUrl = url;
    }
  }

  if (body.exposureMode !== undefined && body.exposureMode !== null) {
    updated.exposureMode = resolveExposureMode(body.exposureMode);
  }

  await saveSettings(updated);

  const dailySeoLimit = resolveDailySeoLimit(updated);
  let tenantsSynced = 0;
  if (
    body.dailySeoLimit !== undefined &&
    body.dailySeoLimit !== null &&
    isSupabaseConfigured()
  ) {
    try {
      tenantsSynced = await syncAllTenantsDailySeoLimit(dailySeoLimit);
    } catch (e) {
      const message = e instanceof Error ? e.message : "테넌트 한도 동기화 실패";
      return NextResponse.json(
        {
          success: true,
          warning: message,
          dailySeoLimit,
          tenantsSynced: 0,
          serviceAvailableDays:
            updated.serviceAvailableDays ?? DEFAULT_SITE_CONFIG.serviceAvailableDays,
          serviceExpiresAt: updated.serviceExpiresAt,
          serviceDaysRemaining: daysRemainingFromExpiresAt(updated.serviceExpiresAt),
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    dailySeoLimit,
    tenantsSynced,
    serviceAvailableDays: updated.serviceAvailableDays ?? DEFAULT_SITE_CONFIG.serviceAvailableDays,
    serviceExpiresAt: updated.serviceExpiresAt,
    serviceDaysRemaining: daysRemainingFromExpiresAt(updated.serviceExpiresAt),
  });
}
