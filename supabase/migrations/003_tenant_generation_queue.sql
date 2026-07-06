-- 테넌트(서브도메인)별 SEO 대량 생성 VM 대기열
create table if not exists public.tenant_generation_jobs (
  id text primary key,
  site_config_id uuid not null references public.site_configs(id) on delete cascade,
  keyword text not null,
  normalized_keyword text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  page_id text,
  slug text,
  error text
);

create index if not exists tenant_generation_jobs_site_status_idx
  on public.tenant_generation_jobs (site_config_id, status);

create index if not exists tenant_generation_jobs_site_requested_idx
  on public.tenant_generation_jobs (site_config_id, requested_at desc);

alter table public.tenant_generation_jobs enable row level security;

create policy "service role full access tenant generation jobs"
  on public.tenant_generation_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
