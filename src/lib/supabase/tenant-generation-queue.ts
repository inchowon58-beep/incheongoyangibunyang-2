import type {
  GenerationJob,
  GenerationJobStatus,
  GenerationQueueData,
} from "@/lib/data";
import { getSupabaseAdmin } from "./tenant-db";

interface TenantGenerationRow {
  id: string;
  site_config_id: string;
  keyword: string;
  normalized_keyword: string;
  status: GenerationJobStatus;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  page_id: string | null;
  slug: string | null;
  error: string | null;
}

function rowToJob(row: TenantGenerationRow): GenerationJob {
  return {
    id: row.id,
    keyword: row.keyword,
    normalizedKeyword: row.normalized_keyword,
    status: row.status,
    requestedAt: row.requested_at,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    pageId: row.page_id || undefined,
    slug: row.slug || undefined,
    error: row.error || undefined,
    siteConfigId: row.site_config_id,
  };
}

export async function getTenantGenerationJobs(
  siteConfigId: string
): Promise<GenerationJob[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tenant_generation_jobs")
    .select("*")
    .eq("site_config_id", siteConfigId)
    .order("requested_at", { ascending: false });

  if (error || !data) return [];
  return (data as TenantGenerationRow[]).map(rowToJob);
}

export async function saveTenantGenerationJob(
  siteConfigId: string,
  job: GenerationJob
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const row = {
    id: job.id,
    site_config_id: siteConfigId,
    keyword: job.keyword,
    normalized_keyword: job.normalizedKeyword,
    status: job.status,
    requested_at: job.requestedAt,
    started_at: job.startedAt || null,
    completed_at: job.completedAt || null,
    page_id: job.pageId || null,
    slug: job.slug || null,
    error: job.error || null,
  };

  const { error } = await supabase.from("tenant_generation_jobs").upsert(row);
  if (error) throw new Error(error.message);
}

export async function loadTenantGenerationQueue(
  siteConfigId: string
): Promise<GenerationQueueData> {
  const jobs = await getTenantGenerationJobs(siteConfigId);
  const updatedAt =
    jobs[0]?.requestedAt ||
    jobs.find((j) => j.completedAt)?.completedAt ||
    new Date().toISOString();
  return { updatedAt, jobs };
}

export async function persistTenantGenerationQueue(
  siteConfigId: string,
  queue: GenerationQueueData
): Promise<void> {
  for (const job of queue.jobs) {
    await saveTenantGenerationJob(siteConfigId, job);
  }
}

/** upsert 대신 전체 pending 교체 시 기존 pending 삭제 */
export async function clearTenantPendingJobs(siteConfigId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { error } = await supabase
    .from("tenant_generation_jobs")
    .delete()
    .eq("site_config_id", siteConfigId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
}

export async function deleteTenantGenerationJob(
  siteConfigId: string,
  jobId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { error } = await supabase
    .from("tenant_generation_jobs")
    .delete()
    .eq("site_config_id", siteConfigId)
    .eq("id", jobId);

  if (error) throw new Error(error.message);
}
