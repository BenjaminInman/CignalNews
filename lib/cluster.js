// ---------------------------------------------------------------------------
// Event clustering — groups stories covering the same event BEFORE extraction.
//
// Two payoffs:
//   1. Corroboration count becomes a confidence weight (the gate requires >= 2).
//   2. You stop generating five near-identical articles about one announcement.
//
// Deterministic on purpose: normalised title shingles + Jaccard similarity.
// No embedding API call, so this costs nothing and behaves identically on every
// run, which matters when you are debugging why two stories did or didn't merge.
// ---------------------------------------------------------------------------

const STOP = new Set([
  "the","a","an","and","or","but","of","in","on","for","to","from","by","with",
  "as","at","is","are","was","were","be","been","it","its","this","that","these",
  "those","new","says","say","said","report","reports","amid","after","before",
  "us","u.s.","percent","year","years","over","up","down","more","less","than",
]);

// Light suffix stripping. Without it, "climb"/"climbing" and "squeeze"/
// "squeezing" score as unrelated tokens and same-event stories from different
// outlets fail to merge — headline verbs are exactly where outlets differ most.
export function stem(w) {
  let x = w;
  if (x.length > 5 && x.endsWith("ing")) x = x.slice(0, -3);
  else if (x.length > 4 && x.endsWith("ed")) x = x.slice(0, -2);
  else if (x.length > 4 && x.endsWith("es")) x = x.slice(0, -2);
  else if (x.length > 3 && x.endsWith("s") && !x.endsWith("ss")) x = x.slice(0, -1);
  if (x.length > 4 && x.endsWith("e")) x = x.slice(0, -1);
  return x;
}

export function normalise(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "")
    .replace(/[^a-z0-9%.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w) && w.length > 1)
    .map(stem);
}

// Bigram shingles capture phrase order; unigrams alone over-merge unrelated
// stories that happen to share vocabulary.
export function shingles(title) {
  const w = normalise(title);
  const out = new Set(w);
  for (let i = 0; i < w.length - 1; i++) out.add(`${w[i]}_${w[i + 1]}`);
  return out;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export const DEFAULTS = {
  threshold: 0.20,      // tuned on real headline pairs; see test-cluster.mjs
  windowHours: 48,
};

// items: [{ id, title, source, category, published_at }]
// -> [{ signature, headline_seed, members[], sources[], corroboration }]
export function clusterArticles(items, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const windowMs = cfg.windowHours * 3600 * 1000;

  const prepared = items
    .map((it) => ({ ...it, sh: shingles(it.title), t: new Date(it.published_at || Date.now()).getTime() }))
    .filter((it) => it.sh.size > 0)
    .sort((a, b) => a.t - b.t);

  // Single-linkage: score against the best-matching MEMBER, not against a union
  // of the cluster's shingles. Unioning inflates the denominator, so each new
  // member makes the cluster progressively harder to join — which silently
  // splits large events across several clusters.
  const clusters = [];
  for (const it of prepared) {
    let best = null, bestScore = 0;
    for (const c of clusters) {
      if (Math.abs(it.t - c.t) > windowMs) continue;
      let s = 0;
      for (const m of c.members) {
        const v = jaccard(it.sh, m.sh);
        if (v > s) s = v;
      }
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (best && bestScore >= cfg.threshold) {
      best.members.push(it);
      best.t = Math.max(best.t, it.t);
    } else {
      clusters.push({ t: it.t, members: [it] });
    }
  }

  return clusters.map((c) => {
    // distinct sources, not distinct articles — three syndications of one wire
    // story are one source, and must not inflate corroboration.
    const sources = [...new Set(c.members.map((m) => (m.source || "unknown").toLowerCase()))];
    const seed = c.members.slice().sort((a, b) => b.title.length - a.title.length)[0];
    return {
      signature: [...shingles(seed.title)].sort().slice(0, 12).join("|").slice(0, 200),
      headline_seed: seed.title,
      members: c.members.map((m) => ({ id: m.id, title: m.title, source: m.source, url: m.url })),
      sources,
      corroboration: sources.length,
      article_count: c.members.length,
      last_seen: new Date(c.t).toISOString(),
    };
  }).sort((a, b) => b.corroboration - a.corroboration);
}
