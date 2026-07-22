import { LENS_META, OP_VERTICALS } from "./focus";

// ---------------------------------------------------------------------------
// Composer — turns a reconciled FACT SET into an original article.
//
// THE FIREWALL: this module never receives source article prose. Its only input
// is structured facts already extracted, scrubbed and reconciled upstream. The
// model therefore cannot reproduce publisher expression, because it never sees
// any. Facts are not copyrightable; expression is. Enforced by signature, not
// by instruction — there is no parameter through which body text could arrive.
//
// Output shape mirrors the design system: facts panel, then a clearly separated
// signal panel. The CTA band is rendered outside both and is never generated
// here, so commercial copy cannot contaminate the signal layer.
// ---------------------------------------------------------------------------

const SIGNAL_RULES = `The signal layer is OBSERVATIONAL ONLY.
- Describe what the pattern is consistent with. Never say what the reader should do.
- Banned: should, must, need to, ought, recommend, advise, we suggest, take action,
  make sure, be sure to, start doing, stop doing, the play is, your move.
- Frame every read as correlation, not causation. Prefer "consistent with",
  "tends to accompany", "has historically coincided with".
- Prescription belongs to the training product and must never appear on the site.`;

function factLine(f) {
  const v = f.value === null || f.value === undefined
    ? (f.value_text || "").slice(0, 200)
    : `${f.value}${f.unit && f.unit !== "count" ? f.unit : ""}`;
  return [
    `[${f.id}]`,
    `${f.label || f.indicator}:`,
    v,
    f.period ? `(${f.period})` : "",
    f.direction ? `dir=${f.direction}` : "",
    `cycle=${f.cycle_class || "?"}`,
    `conf=${Number(f.confidence).toFixed(2)}`,
    `corrob=${f.corroboration || 1}`,
    f.layer === "verified" ? "VERIFIED" : "field",
  ].filter(Boolean).join(" ");
}

export function buildSystemPrompt({ lens = "run", opVertical = null } = {}) {
  const meta = LENS_META[lens];
  return `You write for ${meta.site}, a US multifamily publication read by ${meta.reader}.
Its lens is "${meta.label}" — it covers ${meta.covers}.
${opVertical ? `This piece sits in the "${opVertical}" vertical.` : ""}

You will receive ONLY a list of verified facts, each with a bracketed id. You have
no access to any source article. Write entirely from the supplied facts.

HARD RULES
- Every factual sentence must cite the fact ids it rests on, as [f1] or [f1,f3].
- Never state a number that does not appear in the fact list. No exceptions.
- Never infer a figure, trend or total that is not explicitly supplied.
- If the facts are too thin to support a section, return fewer ticker cells or a
  shorter body. Do not pad.
- Facts marked VERIFIED outrank facts marked field. If they disagree, use VERIFIED
  and ignore the conflicting field value silently.
- Plain declarative prose. No hype, no rhetorical questions, no "in today's market".

${SIGNAL_RULES}

Return ONLY a JSON object, no prose or code fences:
{
  "headline": "under 95 chars, specific, no colon-clickbait",
  "dek": "one sentence, under 180 chars",
  "ticker": [{"label":"<=16 chars","value":"e.g. 8.9%","note":"<=12 chars","fact_ids":["f1"]}],
  "facts_body": [{"text":"one paragraph","fact_ids":["f1","f2"]}],
  "signal": {
    "cycle_read": {"text":"one sentence","fact_ids":["f1"]},
    "leading":    {"text":"one sentence","fact_ids":["f2"]},
    "coincident": {"text":"one sentence","fact_ids":["f3"]},
    "lagging":    {"text":"one sentence","fact_ids":["f4"]},
    "pattern":    {"text":"2-3 sentences","fact_ids":["f1","f3"]},
    "read_with_care": {"text":"2-3 sentences naming the main way this read could mislead","fact_ids":[]}
  },
  "slug": "kebab-case-from-headline",
  "meta_description": "under 155 chars"
}`;
}

export function buildUserPrompt(facts) {
  return `FACTS (${facts.length}):\n${facts.map(factLine).join("\n")}`;
}

// facts: reconciled records, each with { id, indicator, label, value, value_text,
// unit, period, direction, cycle_class, confidence, corroboration, layer }
export async function composeArticle(facts, opts = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "no_api_key" };
  if (!Array.isArray(facts) || !facts.length) return { ok: false, reason: "no_facts" };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.COMPOSE_MODEL || "claude-sonnet-5",
      max_tokens: 3000,
      system: buildSystemPrompt(opts),
      messages: [{ role: "user", content: buildUserPrompt(facts) }],
    }),
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };

  const data = await res.json();
  let text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s === -1 || e === -1) return { ok: false, reason: "unparseable" };
  try {
    return { ok: true, draft: JSON.parse(text.slice(s, e + 1)) };
  } catch {
    return { ok: false, reason: "bad_json" };
  }
}
