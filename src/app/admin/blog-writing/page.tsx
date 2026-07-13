import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/metadata";
import BlogWritingClient from "./BlogWritingClient";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildPageMetadata(config, {
    title: "블로그작성",
    description: `${config.brandName} 네이버 블로그 자동작성 설정`,
    path: "/admin/blog-writing",
    noIndex: true,
  });
}

export default async function BlogWritingPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/");
  return <BlogWritingClient />;
}
