// ---------------------------------------------------------------------------
// Focus taxonomy — routes a story to a network site.
//
// Sub-brands are organised by LENS (how a reader relates to the asset), not by
// subject matter. The same underlying event belongs to exactly one lens, so an
// article has exactly one home and the sites never cannibalise each other.
//
// Splitting Cignal News into the focused sites is therefore a QUERY, not a
// migration: tag at extraction, filter at read time.
// ---------------------------------------------------------------------------

export const LENSES = ["run", "manage", "measure", "finance"];

export const LENS_META = {
  run: {
    site: "multifamily30x",
    label: "RUN it",
    reader: "owner-operators",
    covers: "leasing, turns/maintenance, staffing, systems, ops tooling, scaling",
  },
  manage: {
    site: "propertymanagementrx",
    label: "MANAGE it",
    reader: "PM firms, on-site leaders",
    covers: "resident experience, retention, on-site teams, 3rd-party PM performance, delinquency",
  },
  measure: {
    site: "t12review",
    label: "MEASURE it",
    reader: "asset managers, owners, analysts",
    covers: "income, collections/bad debt, economic vacancy, expense line items, NOI",
  },
  finance: {
    site: "capstack",
    label: "FINANCE it",
    reader: "sponsors, capital partners",
    covers: "debt, equity, rates, cap rates, deal structuring",
  },
};

// Operational verticals — the Multifamily30x category bar. Only meaningful when
// lens === "run"; null otherwise.
export const OP_VERTICALS = [
  "leasing",
  "turns",
  "staffing",
  "systems",
  "expenses",
  "retention",
];

// Content format is a SEPARATE axis from vertical. A review of leasing software
// is format=review, vertical=systems. Conflating the two muddies the taxonomy.
export const CONTENT_FORMATS = ["news", "analysis", "review"];

// The tie-breaker, stated as worked examples. Ambiguity between lenses is the
// single most common tagging error, so this text is injected into the prompt
// verbatim rather than paraphrased.
export const TIE_BREAKER = `Same event, different lens — decide by WHOSE DECISION the fact informs:
- Cutting turn time so units come back online faster -> run (an operator acts)
- That same turnover showing up as rising R&M expense on the statement -> measure (an analyst reads)
- A PM firm restructuring its on-site team -> manage (a management company acts)
- The debt cost that makes the whole deal pencil or not -> finance (a sponsor acts)
If two lenses seem to fit, ask: who changes what they do on Monday because of this fact?`;

export const lensToSite = (lens) => LENS_META[lens]?.site ?? null;
export const isLens = (v) => LENSES.includes(v);
export const isOpVertical = (v) => OP_VERTICALS.includes(v);
export const isFormat = (v) => CONTENT_FORMATS.includes(v);

// Coercion helpers mirroring the defensive style already used in lib/extract.js
export function coerceLens(v) {
  const s = String(v || "").trim().toLowerCase();
  return isLens(s) ? s : null;
}
export function coerceOpVertical(v, lens) {
  if (lens !== "run") return null;
  const s = String(v || "").trim().toLowerCase();
  return isOpVertical(s) ? s : null;
}
export function coerceFormat(v) {
  const s = String(v || "").trim().toLowerCase();
  return isFormat(s) ? s : "news";
}
