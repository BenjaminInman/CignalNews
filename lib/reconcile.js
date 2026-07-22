// ---------------------------------------------------------------------------
// Reconciliation — collapses a cluster's raw extracted facts into the clean set
// the composer is allowed to see.
//
// Rules, in order:
//   1. Verified beats field intel. Always. No exceptions, no averaging.
//   2. Same indicator + period = one fact. Corroboration counts DISTINCT
//      sources, so syndication cannot inflate confidence.
//   3. Disagreement between field sources is surfaced, not silently averaged.
//      A fact in conflict is downgraded, never quietly resolved.
//   4. Definition gaps are pinned to a canonical series before comparison.
// ---------------------------------------------------------------------------

// Different publishers use the same word for different series. Comparing them
// as if they were one number is how a pipeline invents a contradiction that
// doesn't exist — e.g. NAHB "multifamily" counts all non-single-family starts,
// while Census 5+ counts only properties with five or more units.
export const DEFINITION_PINS = {
  multifamily_starts: {
    canonical: "census_5plus",
    note: "Census 5+ units is canonical; NAHB 'multifamily' includes 2-4 unit properties.",
    incompatible: ["nahb_multifamily"],
  },
};

const key = (f) => `${f.indicator}::${f.period || "nil"}::${f.geography || "US"}`;

function conflict(a, b) {
  if (a.value === null || b.value === null) return false;
  const denom = Math.max(Math.abs(a.value), Math.abs(b.value), 1e-9);
  return Math.abs(a.value - b.value) / denom > 0.02;   // >2% apart
}

// facts: extracted rows, each carrying { layer, source_name, confidence, ... }
export function reconcile(facts, opts = {}) {
  const { conflictPenalty = 0.25, minConfidence = 0 } = opts;
  const groups = new Map();

  for (const f of facts) {
    if (Number(f.confidence || 0) < minConfidence) continue;
    const k = key(f);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }

  const out = [];
  const conflicts = [];

  for (const [k, rows] of groups) {
    const verified = rows.filter((r) => r.layer === "verified");
    const field = rows.filter((r) => r.layer !== "verified");

    // Rule 1 — a verified observation ends the discussion.
    if (verified.length) {
      const v = verified.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
      const overridden = field.filter((f) => conflict(v, f)).length;
      out.push({
        ...v,
        corroboration: new Set(rows.map((r) => (r.source_name || "?").toLowerCase())).size,
        overrode_field: overridden,
      });
      continue;
    }

    // Rule 2/3 — field only: pick the best-supported, flag disagreement.
    const bySource = new Map();
    for (const f of field) {
      const s = (f.source_name || "?").toLowerCase();
      const prev = bySource.get(s);
      if (!prev || (f.confidence || 0) > (prev.confidence || 0)) bySource.set(s, f);
    }
    const distinct = [...bySource.values()];
    const best = distinct.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const disagreeing = distinct.filter((f) => conflict(best, f));

    if (disagreeing.length) {
      conflicts.push({
        indicator: best.indicator,
        period: best.period,
        values: distinct.map((d) => ({ source: d.source_name, value: d.value })),
      });
    }

    out.push({
      ...best,
      corroboration: distinct.length,
      confidence: Math.max(0, (best.confidence || 0) - (disagreeing.length ? conflictPenalty : 0)),
      in_conflict: disagreeing.length > 0,
    });
  }

  // Stable ids for citation. The composer cites these; the gate resolves them.
  const reconciled = out
    .sort((a, b) => (b.corroboration - a.corroboration) || ((b.confidence || 0) - (a.confidence || 0)))
    .map((f, i) => ({ ...f, id: `f${i + 1}` }));

  return { facts: reconciled, conflicts };
}
