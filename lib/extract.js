import { INDICATORS, CYCLE_CLASSES, RE_CATEGORIES } from "./indicators";
import { LENSES, OP_VERTICALS, CONTENT_FORMATS, TIE_BREAKER, LENS_META,
         coerceLens, coerceOpVertical, coerceFormat } from "./focus";

// Extracts structured, real-estate-relevant economic data points from a news
// article. Removes opinion / political framing / speculation and keeps only
// verifiable facts, paraphrased (never verbatim — copyright). Output feeds the
// Field Intel layer only; it never touches Verified data.

const CATALOG = Object.entries(INDICATORS)
  .map(([k, v]) => `- ${k} (${v.category}, ${v.cycle_class}, ${v.unit}): ${v.label}`)
  .join("\n");

const SYSTEM_PROMPT = `You are a data-extraction engine for a U.S. real-estate and investing intelligence service. From a single news article you output ONLY hard, verifiable economic facts that bear on real estate or real-estate investing.

Rules:
- Extract facts only. Strip out all opinion, editorializing, prediction stated as fact, political framing, and advocacy. If a sentence argues, persuades, or speculates, ignore it. Keep numbers, official actions taken, and stated measured changes.
- Paraphrase. Never copy sentences from the article. value_text must be your own short factual restatement, not a quote.
- Do not invent or infer figures that are not stated. If the article contains no hard real-estate/economic facts, output an empty array.
- Map each fact to a canonical indicator key from the catalog when one fits; otherwise use a concise snake_case key and lower the confidence.
- Classify each fact's place in the market cycle: one of ${CYCLE_CLASSES.join(", ")}.
- category must be one of: ${RE_CATEGORIES.join(", ")}.
- value is the numeric value when the fact is quantified, else null (put the qualitative fact in value_text, e.g. a policy action).
- period is the as-of time exactly as stated (e.g. "May 2026", "Q2 2026", "week of 2026-05-28"); null if none.
- direction is up | down | flat when a change is stated, else null.
- confidence 0..1: ~0.9+ for an explicit official figure, lower for vague, secondhand, or opinion-adjacent facts.

Canonical indicators:
${CATALOG}

Routing — in addition to the economic classification above, tag each fact for
network routing:

- lens: which reader's decision this fact informs. One of ${LENSES.join(", ")}.
${Object.entries(LENS_META).map(([k, v]) => `  - ${k} (${v.label}) — ${v.reader}: ${v.covers}`).join("\n")}

${TIE_BREAKER}

- op_vertical: ONLY when lens is "run". One of ${OP_VERTICALS.join(", ")}. null otherwise.
- content_format: ${CONTENT_FORMATS.join(", ")}. Use "review" only when the article evaluates a named product or vendor; "analysis" when it interprets data; else "news".
- lens_confidence 0..1: how cleanly this fact sits in one lens. Below 0.6 the fact routes to the flagship rather than a focused site.

A single article may yield facts for several lenses. Tag each fact independently — do NOT force one article into one lens.

Output ONLY a JSON array of objects with keys: indicator, label, category, cycle_class, value, value_text, unit, geography, period, direction, confidence, lens, op_vertical, content_format, lens_confidence. No prose, no markdown, no code fences. Empty array if nothing qualifies.`;

function coerceCycle(c) {
  return CYCLE_CLASSES.includes(c) ? c : null;
}
function coerceCategory(c) {
  return RE_CATEGORIES.includes(c) ? c : null;
}
function coerceNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function clampConf(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function normalizeFocusFields(raw) {
  const lens = coerceLens(raw.lens);
  return {
    lens,
    op_vertical: coerceOpVertical(raw.op_vertical, lens),
    content_format: coerceFormat(raw.content_format),
    lens_confidence: clampConf(raw.lens_confidence),
  };
}

// Routing: a confident single lens goes to that lens's site; anything ambiguous
// falls back to the flagship so nothing is silently dropped.
export const LENS_CONFIDENCE_FLOOR = 0.6;
export function routeFact(fact) {
  if (!fact.lens || fact.lens_confidence < LENS_CONFIDENCE_FLOOR) return "cignalnews";
  return LENS_META[fact.lens].site;
}

function normalize(raw) {
  if (!raw || typeof raw !== "object" || !raw.indicator) return null;
  const indicator = String(raw.indicator).trim().toLowerCase().replace(/\s+/g, "_");
  const meta = INDICATORS[indicator];
  return {
    indicator,
    label: raw.label || (meta && meta.label) || indicator,
    category: coerceCategory(raw.category) || (meta && meta.category) || null,
    cycle_class: coerceCycle(raw.cycle_class) || (meta && meta.cycle_class) || null,
    value: coerceNumber(raw.value),
    value_text: raw.value_text ? String(raw.value_text).slice(0, 400) : null,
    unit: raw.unit || (meta && meta.unit) || null,
    geography: raw.geography || "US",
    period: raw.period ? String(raw.period).slice(0, 60) : null,
    direction: ["up", "down", "flat"].includes(raw.direction) ? raw.direction : null,
    confidence: clampConf(raw.confidence),
    ...normalizeFocusFields(raw),
  };
}

// article: { title, category, source, url, text }
// Returns an array of normalized data-point records (possibly empty).
export async function extractDataPoints(article) {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  const body = (article.text || "").slice(0, 6000);
  const userContent =
    `Source: ${article.source || "unknown"}\n` +
    `Section: ${article.category || "unknown"}\n` +
    `Headline: ${article.title || ""}\n\n` +
    `Article text (may be partial; extract from what is present):\n${body || "(body unavailable — extract only what the headline states as fact)"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.EXTRACT_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    let text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter(Boolean);
  } catch {
    return [];
  }
}
