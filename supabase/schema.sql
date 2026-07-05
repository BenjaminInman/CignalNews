-- Cignal News — field-intelligence schema
-- Run once in the Supabase SQL editor (or via the CLI) to create the tables.
--
-- Two deliberately separate layers:
--   verified_indicators — authoritative, deterministic data (FRED series, official
--     numeric releases). NO LLM in this path. Treated as hard truth.
--   field_intel — data points the LLM extracts from news articles. Confidence-scored
--     and source-linked. Useful for breadth/early signal, but NEVER overrides the
--     verified layer. This is the "field intel folder."
--
-- We never store article body text (copyright): only derived data points + a link.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- articles: lightweight registry used for daily dedupe + extraction bookkeeping.
-- Stores metadata and a link only — never the article body.
-- ---------------------------------------------------------------------------
create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  url          text unique not null,
  url_hash     text unique not null,
  title        text not null,
  source       text,
  category     text,                       -- housing|multifamily|commercial|rates|policy|capital
  official     boolean default false,
  published_at timestamptz,
  ingested_at  timestamptz default now(),
  processed    boolean default false,
  extract_status text default 'pending'    -- pending|done|error|skipped
);
create index if not exists idx_articles_processed on articles (processed);
create index if not exists idx_articles_published on articles (published_at desc);

-- ---------------------------------------------------------------------------
-- verified_indicators: hard truth from deterministic sources (FRED, official).
-- ---------------------------------------------------------------------------
create table if not exists verified_indicators (
  id          uuid primary key default gen_random_uuid(),
  indicator   text not null,               -- canonical key, e.g. 'mortgage_rate_30yr'
  label       text,
  category    text,
  cycle_class text,                         -- leading|coincident|lagging|policy
  value       numeric,
  unit        text,                         -- '%','index','count','usd','bps'
  geography   text default 'US',
  period      date,                         -- as-of period of the observation
  direction   text,                         -- up|down|flat|null
  source_name text not null,
  source_url  text,
  as_of       timestamptz default now(),
  unique (indicator, geography, period, source_name)
);
create index if not exists idx_vi_indicator on verified_indicators (indicator);
create index if not exists idx_vi_category  on verified_indicators (category);

-- ---------------------------------------------------------------------------
-- field_intel: LLM-derived data points from news. Never overrides verified.
-- ---------------------------------------------------------------------------
create table if not exists field_intel (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid references articles(id) on delete cascade,
  indicator    text not null,               -- canonical key when possible
  label        text,
  category     text,
  cycle_class  text,                         -- leading|coincident|lagging|policy
  value        numeric,                      -- null when the fact is qualitative
  value_text   text,                         -- short factual paraphrase (never a verbatim quote)
  unit         text,
  geography    text default 'US',
  period       text,                         -- free-form as stated ('Q2 2026','May 2026')
  direction    text,                         -- up|down|flat|null
  confidence   numeric,                      -- 0..1
  source_name  text,
  source_url   text,
  extracted_at timestamptz default now()
);
create index if not exists idx_fi_indicator  on field_intel (indicator);
create index if not exists idx_fi_category   on field_intel (category);
create index if not exists idx_fi_cycle      on field_intel (cycle_class);
create index if not exists idx_fi_extracted  on field_intel (extracted_at desc);

-- ---------------------------------------------------------------------------
-- RLS: public may READ indicators (this is public economic data); all WRITES go
-- through the service-role key used by the ingest job (which bypasses RLS).
-- ---------------------------------------------------------------------------
alter table articles            enable row level security;
alter table verified_indicators enable row level security;
alter table field_intel         enable row level security;

drop policy if exists "read verified" on verified_indicators;
create policy "read verified" on verified_indicators for select using (true);

drop policy if exists "read field_intel" on field_intel;
create policy "read field_intel" on field_intel for select using (true);
