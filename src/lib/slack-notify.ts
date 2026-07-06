import type { InquiryLead, Settings } from "./data";
import { getSettings } from "./data";

export function resolveSlackWebhookUrl(settings?: Settings): string {
  const fromSettings = settings?.slackWebhookUrl?.trim();
  if (fromSettings) return fromSettings;
  return process.env.SLACK_INQUIRY_WEBHOOK_URL?.trim() || "";
}

function field(label: string, value: string): { type: "mrkdwn"; text: string } {
  return {
    type: "mrkdwn",
    text: `*${label}*\n${value || "-"}`,
  };
}

export async function notifyInquiryToSlack(
  lead: InquiryLead,
  options?: { brandName?: string; siteUrl?: string }
): Promise<boolean> {
  const settings = await getSettings();
  const webhookUrl = resolveSlackWebhookUrl(settings);
  if (!webhookUrl) return false;

  const brand = options?.brandName || "견적 문의";
  const siteBase = (options?.siteUrl || "").replace(/\/$/, "");
  const adminUrl = siteBase ? `${siteBase}/admin/inquiries` : "";
  const pageUrl = siteBase && lead.pageSlug ? `${siteBase}/guide/${lead.pageSlug}` : "";
  const createdAt = new Date(lead.createdAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `🔔 ${brand} — 새 견적 문의`, emoji: true },
    },
    {
      type: "section",
      fields: [
        field("이름", lead.name),
        field("연락처", lead.phone),
        field("주소", lead.address),
        field("업종", lead.businessType),
        field("평수", lead.area),
        field("키워드", lead.keyword),
      ],
    },
  ];

  if (lead.message) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*문의내용*\n${lead.message.slice(0, 1500)}`,
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: [
          `접수: ${createdAt}`,
          lead.pageTitle ? `페이지: ${lead.pageTitle}` : "",
          lead.ip ? `IP: ${lead.ip}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      },
    ],
  });

  if (adminUrl || pageUrl) {
    blocks.push({
      type: "actions",
      elements: [
        ...(adminUrl
          ? [
              {
                type: "button",
                text: { type: "plain_text", text: "문의 DB 열기" },
                url: adminUrl,
              },
            ]
          : []),
        ...(pageUrl
          ? [
              {
                type: "button",
                text: { type: "plain_text", text: "유입 페이지" },
                url: pageUrl,
              },
            ]
          : []),
      ],
    });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${brand}] 새 견적 문의 — ${lead.name} / ${lead.phone}`,
        blocks,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
