import { getSupabase, isConfigured } from "../../../lib/supabase";
import { clusterArticles } from "../../../lib/cluster";
import { reconcile } from "../../../lib/reconcile";
import { composeArticle } from "../../../lib/compose";
import { gate } from "../../../lib/gate";
import { LENS_META } from "../../../lib/focus";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs AFTER /api/ingest (09:00). Ingest harvests and extracts; this reconciles
// and writes drafts. Split because the two together exceed any sane timeout.
//
// Nothing here publishes. Every draft lands in `drafts` with status='draft' and
// its gate result attached. A failed gate is not an error — it means the day's
// facts were too thin, and publishing nothing beats publishing something wrong.

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json({ status: "not_configured" });
  }

  const sb = getSupabase();
  const lookbackH = Number(process.env.COMPOSE_LOOKBACK_HOURS || 48);
  const since = new Date(Date.now() - lookbackH * 3600 * 1000).toISOString();
  const maxDrafts = Number(process.env.COMPOSE_MAX || 3);

  // 1) recent articles -> clusters
  const { data: arts } = await sb
    .from("articles")
    .select("id, url, title, source, category, published_at")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(400);
  if (!arts || !arts.length) return Response.json({ status: "ok", clusters: 0, drafts: 0 });

  const clusters = clusterArticles(arts);

  // 2) pull this window's facts once, then bucket by article
  const ids = arts.map((a) => a.id);
  const { data: allFacts } = await sb
    .from("field_intel")
    .select("*")
    .in("article_id", ids)
    .gte("confidence", 0.5);

  const byArticle = new Map();
  for (const f of allFacts || []) {
    if (!byArticle.has(f.article_id)) byArticle.set(f.article_id, []);
    byArticle.get(f.article_id).push(f);
  }

  const results = [];
  let written = 0;

  for (const c of clusters) {
    if (written >= maxDrafts) break;

    const raw = c.members.flatMap((m) => byArticle.get(m.id) || []);
    if (raw.length < 3) continue;

    // dominant lens across the cluster's facts decides the destination site
    const tally = {};
    for (const f of raw) if (f.lens) tally[f.lens] = (tally[f.lens] || 0) + Number(f.lens_confidence || 0.5);
    const lens = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!lens) continue;
    const site = LENS_META[lens].site;

    const scoped = raw.filter((f) => f.lens === lens);
    const { facts, conflicts } = reconcile(scoped, { minConfidence: 0.5 });
    for (const f of facts) f.corroboration = Math.max(f.corroboration || 1, c.corroboration);

    const opVertical = scoped.map((f) => f.op_vertical).filter(Boolean)[0] || null;
    const composed = await composeArticle(facts, { lens, opVertical });
    if (!composed.ok) { results.push({ site, skipped: composed.reason }); continue; }

    const draft = composed.draft;
    const verdict = gate(draft, facts);

    const { error } = await sb.from("drafts").insert({
      site, lens, op_vertical: opVertical,
      slug: draft.slug, headline: draft.headline, dek: draft.dek,
      body: draft,
      fact_ids: facts.map((f) => f.id),
      gate_pass: verdict.pass,
      gate_failures: verdict.failures,
      gate_warnings: [...verdict.warnings, ...conflicts.map((x) => `conflict: ${x.indicator}`)],
      coverage: verdict.coverage,
      status: "draft",
      compose_model: process.env.COMPOSE_MODEL || "claude-sonnet-5",
    });
    if (!error) written += 1;
    results.push({ site, slug: draft.slug, gate_pass: verdict.pass, failures: verdict.failures.length });
  }

  return Response.json({ status: "ok", clusters: clusters.length, drafts: written, results });
}
