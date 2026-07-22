// ---------------------------------------------------------------------------
// Quality gate — every draft must clear this before it can be published.
// A failure is not an error; it means the day's facts were too thin. Publishing
// nothing is always cheaper than publishing something wrong on a site whose
// only real asset is credibility.
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  minFacts: 4,            // distinct reconciled facts backing the piece
  minVerified: 1,         // at least one deterministic (FRED/official) anchor
  minConfidence: 0.65,    // mean confidence across cited facts
  minCorroboration: 2,    // at least one fact seen in >=2 independent sources
  minTicker: 4,
  minBodyParas: 2,
};

// Bare imperatives are the prescription pattern that modal-verb lists miss.
// "Reallocate effort from chasing tenants to keeping them" contains no
// should/must/recommend, but it is unambiguously an instruction. Detected by
// sentence-initial base-form operational verbs.
const IMPERATIVE_VERBS = [
  "reallocate","shift","focus","push","cut","defend","prioritise","prioritize",
  "move","start","stop","reduce","increase","track","build","use","avoid","keep",
  "hold","tighten","loosen","raise","lower","renegotiate","reprice","budget",
  "invest","allocate","trim","expand","delay","accelerate","review","audit",
];
const IMPERATIVE_RE = new RegExp(
  `(?:^|[.!?]\\s+)(${IMPERATIVE_VERBS.join("|")})\\b`, "i"
);

const PRESCRIPTIVE = [
  /\bshould\b/i, /\bmust\b/i, /\bneed to\b/i, /\bought to\b/i,
  /\brecommend(s|ed|ation)?\b/i, /\badvise[sd]?\b/i, /\bwe suggest\b/i,
  /\btake action\b/i, /\bmake sure\b/i, /\bbe sure to\b/i,
  /\bstart (doing|by)\b/i, /\bstop (doing|by)\b/i,
  /\bthe play is\b/i, /\byour move\b/i, /\byou'?ll want to\b/i,
];

// Pull CLAIM-LIKE numbers out of prose. Bare small integers are terminology
// ("5+ units", "30-year", "Q2", "top-quartile") and are ignored deliberately —
// flagging them buries real hallucinations in noise. A token is claim-like when
// it carries a decimal, a unit suffix, thousands separators, or is >= 1000.
function numbersIn(text) {
  const out = new Set();
  const re = /-?\$?\d[\d,]*(?:\.\d+)?(?:%|bps|k|m|b)?/gi;
  for (const m of String(text).matchAll(re)) {
    const raw = m[0];
    const after = String(text).slice(m.index + raw.length, m.index + raw.length + 1);
    if (/[a-z0-9]/i.test(after) && !/[%kmb]$/i.test(raw)) continue; // mid-word, skip
    const norm = raw.toLowerCase().replace(/[\s,$]/g, "");
    const bare = norm.replace(/(%|bps|k|m|b)$/i, "");
    const claimLike =
      /[.]/.test(bare) ||
      /(%|bps|k|m|b)$/i.test(norm) ||
      /,/.test(raw) ||
      Math.abs(Number(bare)) >= 1000;
    if (claimLike) out.add(norm);
  }
  return out;
}

function factNumbers(facts) {
  const out = new Set();
  const add = (v) => { if (v !== "" && v !== null && v !== undefined) out.add(String(v).toLowerCase()); };
  for (const f of facts) {
    if (f.value !== null && f.value !== undefined) {
      const n = Number(f.value);
      const variants = new Set();
      for (const base of [String(f.value), String(Math.abs(n))]) {
        variants.add(base);
        variants.add(base.replace(/\.0+$/, ""));
        if (!/\./.test(base)) variants.add(base + ".0");
      }
      for (const v of variants) {
        add(v);
        if (f.unit === "%")   add(v + "%");
        if (f.unit === "bps") add(v + "bps");
      }
      // scaled restatements: 124600 -> 124.6k / 124600
      if (Number.isFinite(n)) {
        const a = Math.abs(n);
        if (a >= 1000) { add((a/1e3) + "k"); add((a/1e3).toFixed(1) + "k"); }
        if (a >= 1e6)  { add((a/1e6) + "m"); add((a/1e6).toFixed(1) + "m"); }
      }
    }
    // numbers appearing in supplied text/period/label are legitimate to restate
    for (const src of [f.value_text, f.period, f.label, f.indicator]) {
      for (const t of numbersIn(src || "")) out.add(t);
    }
  }
  return out;
}

function walk(draft) {
  const segs = [];
  const push = (path, node) => {
    if (node && typeof node.text === "string") {
      segs.push({ path, text: node.text, ids: node.fact_ids || [] });
    }
  };
  (draft.ticker || []).forEach((t, i) =>
    segs.push({ path: `ticker[${i}]`, text: `${t.label} ${t.value} ${t.note || ""}`, ids: t.fact_ids || [] }));
  (draft.facts_body || []).forEach((p, i) =>
    segs.push({ path: `facts_body[${i}]`, text: p.text, ids: p.fact_ids || [] }));
  const sig = draft.signal || {};
  ["cycle_read", "leading", "coincident", "lagging", "pattern", "read_with_care"]
    .forEach((k) => push(`signal.${k}`, sig[k]));
  segs.push({ path: "headline", text: draft.headline || "", ids: [] });
  segs.push({ path: "dek", text: draft.dek || "", ids: [] });
  return segs;
}

export function gate(draft, facts, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const failures = [];
  const warnings = [];
  const byId = new Map(facts.map((f) => [String(f.id), f]));
  const allowed = factNumbers(facts);

  // --- corpus-level thresholds -------------------------------------------
  if (facts.length < cfg.minFacts) failures.push(`only ${facts.length} facts (need ${cfg.minFacts})`);
  const verified = facts.filter((f) => f.layer === "verified").length;
  if (verified < cfg.minVerified) failures.push(`no verified anchor (need ${cfg.minVerified})`);
  // Corroboration is a proxy for "did anyone else see this". It is the right
  // test for a CLAIM reported by an outlet. It is the wrong test for a figure
  // published by the data producer itself — nobody needs a second outlet to
  // confirm what Cushman & Wakefield or the Census Bureau published. So the
  // floor applies only when the piece rests on field intel with no verified
  // anchor.
  const maxCorrob = Math.max(0, ...facts.map((f) => f.corroboration || 1));
  const verifiedShare = verified / (facts.length || 1);
  if (verifiedShare < 0.5 && maxCorrob < cfg.minCorroboration) {
    failures.push(`max corroboration ${maxCorrob} (need ${cfg.minCorroboration} when under half the facts are verified)`);
  }
  const meanConf = facts.reduce((a, f) => a + Number(f.confidence || 0), 0) / (facts.length || 1);
  if (meanConf < cfg.minConfidence) failures.push(`mean confidence ${meanConf.toFixed(2)} (need ${cfg.minConfidence})`);
  if ((draft.ticker || []).length < cfg.minTicker) failures.push(`ticker has ${(draft.ticker || []).length} cells (need ${cfg.minTicker})`);
  if ((draft.facts_body || []).length < cfg.minBodyParas) failures.push(`body has ${(draft.facts_body || []).length} paragraphs (need ${cfg.minBodyParas})`);

  // --- per-segment checks -------------------------------------------------
  const cited = new Set();
  for (const seg of walk(draft)) {
    for (const id of seg.ids) {
      if (!byId.has(String(id))) failures.push(`${seg.path}: cites unknown fact id "${id}"`);
      else cited.add(String(id));
    }
    // orphan numbers — the core hallucination check
    for (const n of numbersIn(seg.text)) {
      if (!allowed.has(n)) failures.push(`${seg.path}: number "${n}" not present in fact set`);
    }
    // body paragraphs and signal reads must be attributed
    if (/^(facts_body|signal\.(cycle_read|leading|coincident|lagging|pattern))/.test(seg.path)
        && seg.ids.length === 0) {
      failures.push(`${seg.path}: no fact_ids cited`);
    }
  }

  // --- signal layer must stay observational -------------------------------
  const sig = draft.signal || {};
  for (const [k, node] of Object.entries(sig)) {
    const t = node && node.text;
    if (!t) continue;
    for (const re of PRESCRIPTIVE) {
      if (re.test(t)) failures.push(`signal.${k}: prescriptive language ${re} — belongs to Econiq, not the site`);
    }
    const imp = t.match(IMPERATIVE_RE);
    if (imp) failures.push(`signal.${k}: bare imperative "${imp[1]}" — instruction, not observation`);
  }

  const unused = facts.filter((f) => !cited.has(String(f.id)));
  if (unused.length) warnings.push(`${unused.length} fact(s) supplied but never cited`);
  if ((draft.headline || "").length > 95) warnings.push("headline over 95 chars");
  if ((draft.meta_description || "").length > 155) warnings.push("meta_description over 155 chars");

  return { pass: failures.length === 0, failures, warnings, coverage: cited.size / (facts.length || 1) };
}
