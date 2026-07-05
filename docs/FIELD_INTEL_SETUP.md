# Field Intelligence Pipeline — setup

Daily ingest that turns the real-estate news feed into a queryable indicator DB.

## Two layers
- **Verified** (`verified_indicators`) — deterministic, no LLM. Latest observations
  of mapped FRED series. Treated as hard truth.
- **Field Intel** (`field_intel`) — LLM-extracted data points from news articles,
  confidence-scored and source-linked. Never overrides Verified.

Article body text is never stored — only derived data points plus a source link.

## One-time setup
1. **Create the tables.** In the Supabase project → SQL editor, run `supabase/schema.sql`.
2. **Add environment variables in Vercel** (Project → Settings → Environment Variables).
   Do not paste secrets into chat — add them here directly:
   - `SUPABASE_URL` — project URL (Project Settings → API)
   - `SUPABASE_SERVICE_KEY` — service-role key (Project Settings → API). Server-only.
   - `ANTHROPIC_API_KEY` — for the extraction step.
   - `FRED_API_KEY` — already set (used by the macro strip); reused for the Verified layer.
   - `CRON_SECRET` — any long random string; Vercel sends it as a Bearer token to the cron.
   - `EXTRACT_MODEL` *(optional)* — defaults to `claude-haiku-4-5-20251001`.
   - `INGEST_MAX` *(optional)* — max articles extracted per run (default 25) to cap cost.
3. **Redeploy.** The cron in `vercel.json` runs daily at 09:00 UTC.

## Manual test
```
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/ingest
```
Returns a JSON summary: `{ verified, articles_seen, registered, processed, data_points }`.
Before the env vars are set it safely returns `{ status: "not_configured" }`.

## Reading the data (already wired in `lib/intel.js`)
- `getIndicator("mortgage_rate_30yr")` → `{ verified: [...], field: [...] }`
- `resolveIndicator("cap_rate")` → single best value (Verified first, else top Field Intel, layer-tagged)
- `listByCycle("leading")`, `listByCategory("multifamily")`, `recentFieldIntel({ minConfidence: 0.8 })`

## Cost control
Only new (unprocessed) articles are extracted, capped by `INGEST_MAX` per run, using the
Haiku model by default. Raise the cap or model once you've seen real volume and cost.
