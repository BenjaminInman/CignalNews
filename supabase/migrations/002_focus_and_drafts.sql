-- ---------------------------------------------------------------------------
-- 002 — focus routing + generated drafts
--
-- Additive only. Existing rows keep working: focus columns are nullable and
-- untagged facts simply route to the flagship (Cignal News), so nothing is
-- silently dropped while the backfill runs.
-- ---------------------------------------------------------------------------

-- Focus tags on extracted facts ------------------------------------------------
alter table field_intel add column if not exists lens            text;   -- run|manage|measure|finance
alter table field_intel add column if not exists op_vertical     text;   -- leasing|turns|staffing|systems|expenses|retention
alter table field_intel add column if not exists content_format  text default 'news';
alter table field_intel add column if not exists lens_confidence numeric default 0.5;
alter table field_intel add column if not exists cluster_id      uuid;
alter table field_intel add column if not exists corroboration   int  default 1;

alter table verified_indicators add column if not exists lens        text;
alter table verified_indicators add column if not exists op_vertical text;

create index if not exists idx_fi_lens        on field_intel (lens);
create index if not exists idx_fi_op_vertical on field_intel (op_vertical);
create index if not exists idx_fi_cluster     on field_intel (cluster_id);

alter table field_intel drop constraint if exists chk_fi_lens;
alter table field_intel add constraint chk_fi_lens
  check (lens is null or lens in ('run','manage','measure','finance'));

alter table field_intel drop constraint if exists chk_fi_opvert;
alter table field_intel add constraint chk_fi_opvert
  check (op_vertical is null or op_vertical in
    ('leasing','turns','staffing','systems','expenses','retention'));

-- op_vertical only means anything under the "run" lens
alter table field_intel drop constraint if exists chk_fi_opvert_requires_run;
alter table field_intel add constraint chk_fi_opvert_requires_run
  check (op_vertical is null or lens = 'run');

-- Event clusters: same story across outlets, grouped BEFORE extraction so that
-- corroboration count can act as a confidence weight.
create table if not exists clusters (
  id            uuid primary key default gen_random_uuid(),
  signature     text unique not null,        -- shingle/embedding key
  headline_seed text,
  lens          text,
  op_vertical   text,
  first_seen    timestamptz default now(),
  last_seen     timestamptz default now(),
  article_count int default 1
);
create index if not exists idx_clusters_lens on clusters (lens);
create index if not exists idx_clusters_seen on clusters (last_seen desc);

-- Generated drafts. Never published directly — must clear lib/gate.js first.
create table if not exists drafts (
  id             uuid primary key default gen_random_uuid(),
  site           text not null,              -- multifamily30x | t12review | ...
  lens           text,
  op_vertical    text,
  cluster_id     uuid references clusters(id) on delete set null,
  slug           text,
  headline       text,
  dek            text,
  body           jsonb not null,             -- full composer output
  fact_ids       uuid[] not null default '{}',
  gate_pass      boolean default false,
  gate_failures  jsonb default '[]'::jsonb,
  gate_warnings  jsonb default '[]'::jsonb,
  coverage       numeric,
  status         text default 'draft',       -- draft|approved|published|rejected
  compose_model  text,
  created_at     timestamptz default now(),
  reviewed_at    timestamptz,
  published_at   timestamptz,
  unique (site, slug)
);
create index if not exists idx_drafts_status on drafts (site, status, created_at desc);

alter table clusters enable row level security;
alter table drafts   enable row level security;

-- Drafts are private until published; clusters are internal bookkeeping.
drop policy if exists "read published drafts" on drafts;
create policy "read published drafts" on drafts
  for select using (status = 'published');
