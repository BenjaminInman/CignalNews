import crypto from "crypto";
import { getNews } from "../../../lib/feeds";
import { getSupabase, isConfigured } from "../../../lib/supabase";
import { syncVerifiedFromFRED } from "../../../lib/verified";
import { extractDataPoints } from "../../../lib/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const hash = (s) => crypto.createHash("sha1").update(s).digest("hex");

// Best-effort article body fetch. Some publishers block bots or paywall; we
// degrade to headline-only extraction when the body can't be retrieved.
async function fetchArticleText(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CignalNewsBot/1.0)" },
      signal: ctrl.signal,
      redirect: "follow",
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return "";
  }
}

export async function GET(request) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json({ status: "not_configured", note: "Set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable ingest." });
  }

  const sb = getSupabase();
  const maxArticles = Number(process.env.INGEST_MAX || 25);

  // 1) Verified layer (deterministic, no LLM)
  const verified = await syncVerifiedFromFRED();

  // 2) Pull current news, register new articles (metadata + link only)
  const { items } = await getNews();
  const withHash = items
    .filter((it) => it.link && it.link !== "#")
    .map((it) => ({ ...it, url_hash: hash(it.link) }));

  const hashes = withHash.map((it) => it.url_hash);
  const existing = new Set();
  for (let i = 0; i < hashes.length; i += 200) {
    const chunk = hashes.slice(i, i + 200);
    const { data } = await sb.from("articles").select("url_hash").in("url_hash", chunk);
    (data || []).forEach((r) => existing.add(r.url_hash));
  }

  const fresh = [];
  const seen = new Set();
  for (const it of withHash) {
    if (existing.has(it.url_hash) || seen.has(it.url_hash)) continue;
    seen.add(it.url_hash);
    fresh.push(it);
  }

  let registered = 0;
  if (fresh.length) {
    const rows = fresh.map((it) => ({
      url: it.link,
      url_hash: it.url_hash,
      title: it.title,
      source: it.source || null,
      category: it.category || null,
      official: Boolean(it.official),
      published_at: it.date ? new Date(it.date).toISOString() : null,
    }));
    const { error } = await sb.from("articles").upsert(rows, { onConflict: "url_hash", ignoreDuplicates: true });
    if (!error) registered = rows.length;
  }

  // 3) Extract Field Intel from a batch of unprocessed articles
  const { data: pending } = await sb
    .from("articles")
    .select("id, url, title, source, category")
    .eq("processed", false)
    .order("published_at", { ascending: false })
    .limit(maxArticles);

  let processed = 0;
  let dataPoints = 0;
  for (const art of pending || []) {
    try {
      const text = await fetchArticleText(art.url);
      const points = await extractDataPoints({ ...art, text });
      if (points.length) {
        const rows = points.map((p) => ({
          ...p,
          article_id: art.id,
          source_name: art.source || null,
          source_url: art.url,
        }));
        await sb.from("field_intel").insert(rows);
        dataPoints += rows.length;
      }
      await sb.from("articles").update({ processed: true, extract_status: "done" }).eq("id", art.id);
      processed += 1;
    } catch {
      await sb.from("articles").update({ processed: true, extract_status: "error" }).eq("id", art.id);
    }
  }

  return Response.json({
    status: "ok",
    verified,
    articles_seen: withHash.length,
    registered,
    processed,
    data_points: dataPoints,
  });
}
