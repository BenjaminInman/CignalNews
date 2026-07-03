// Topical imagery for article cards (US real-estate focus).
//
// Tier 1 (always on): each story is matched to a topic by scanning its headline
//   for keywords, then the story's category. Every topic has a POOL of distinct
//   public-domain / CC0 images committed under /public/img/topics, assigned by
//   ROTATION across a render so two same-topic stories never share a photo. When
//   a topic shows more cards than it has images, it spills into related real-estate
//   imagery (see NEIGHBORS) rather than repeat. No API key required.
//
// Tier 2 (optional): if PEXELS_API_KEY is set, photos are pulled per topic for
//   more variety (also rotated). Any miss/error falls back to the Tier-1 pool.

const P = (k) => `/img/topics/${k}.jpg`;

const POOL = {
  housing:     [P("housing-3"), P("homes-1")],                          // residential streetscape, suburb
  multifamily: [P("housing"), P("housing-2"), P("mf-1")],               // apartments, high-rise, apartment building
  commercial:  [P("growth-3"), P("jobs-2"), P("growth-2")],             // skyline, office, industrial/logistics
  rates:       [P("fed"), P("fed-2"), P("fed-3"), P("treasury"), P("money")],
  policy:      [P("capitol"), P("capitol-2"), P("capitol-3")],
  capital:     [P("markets"), P("markets-2"), P("money-2"), P("money-3")],
};

// Checked in order, first match wins. Specific themes above broad ones.
const KEYWORD_RULES = [
  { key: "rates",       re: /\b(mortgage rate|mortgage rates|interest rate|rate cut|rate hike|fomc|powell|federal reserve|treasury yield|refinanc\w*|lending)\b/ },
  { key: "policy",      re: /\b(zoning|rent control|property tax|tax\b|legislation|regulation|hud|fhfa|fannie|freddie|1031|eviction|congress|senate|bill\b|ordinance|permit reform)\b/ },
  { key: "capital",     re: /\b(reit|reits|cap rate|cap rates|acquisition|transaction|portfolio|fund\b|distress\w*|refinanc\w*|investor|deal\b|underwrit\w*)\b/ },
  { key: "multifamily", re: /\b(multifamily|apartment|apartments|rent|rents|renter|renters|units|workforce housing)\b/ },
  { key: "commercial",  re: /\b(commercial real estate|office|retail|industrial|warehouse|logistics|cre\b|storefront|mall|vacancy)\b/ },
  { key: "housing",     re: /\b(home price|home prices|home sales|housing|homebuyer|homebuild\w*|single[- ]family|for sale|inventory|listings|starts|builder)\b/ },
];

// category id -> image key (identity for the real-estate verticals)
const CATEGORY_KEY = {
  housing: "housing", multifamily: "multifamily", commercial: "commercial",
  rates: "rates", policy: "policy", capital: "capital",
};

// Spillover order when a topic outgrows its own pool — stays within real estate.
const NEIGHBORS = {
  housing:     ["multifamily", "commercial"],
  multifamily: ["housing", "commercial"],
  commercial:  ["capital", "multifamily"],
  rates:       ["capital", "policy"],
  policy:      ["rates", "capital"],
  capital:     ["commercial", "rates"],
};
const ALL_IMAGES = [...new Set(Object.values(POOL).flat())];
const SEQ = Object.fromEntries(
  Object.keys(POOL).map((key) => {
    const seen = new Set();
    const out = [];
    const add = (arr) => { for (const p of arr) if (!seen.has(p)) { seen.add(p); out.push(p); } };
    add(POOL[key]);
    for (const nk of NEIGHBORS[key] || []) add(POOL[nk] || []);
    add(ALL_IMAGES);
    return [key, out];
  })
);

const PEXELS_QUERY = {
  housing: "american suburban home neighborhood",
  multifamily: "apartment building exterior",
  commercial: "commercial office building city",
  rates: "federal reserve mortgage finance",
  policy: "us capitol government building",
  capital: "wall street stock exchange finance",
};

export function imageKeyFor({ title = "", category = "" } = {}) {
  const t = (title || "").toLowerCase();
  for (const rule of KEYWORD_RULES) if (rule.re.test(t)) return rule.key;
  return CATEGORY_KEY[category] || "housing";
}

function poolFor(key) { return SEQ[key] || SEQ.housing; }

export function assignLocalImages(items) {
  const seen = {};
  for (const it of items) {
    if (!it) continue;
    const key = imageKeyFor(it);
    const pool = poolFor(key);
    const n = (seen[key] = (seen[key] || 0) + 1) - 1;
    it.image = pool[n % pool.length];
  }
  return items;
}

// --- Tier 2: optional Pexels enrichment -----------------------------------
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const pexelsCache = new Map();

async function pexelsUrls(query) {
  if (pexelsCache.has(query)) return pexelsCache.get(query);
  const p = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY }, signal: ctrl.signal, next: { revalidate: 86400 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.photos || []).map((ph) => ph?.src?.landscape || ph?.src?.large).filter(Boolean);
    } catch { return []; }
    finally { clearTimeout(timer); }
  })();
  pexelsCache.set(query, p);
  const urls = await p;
  if (!urls.length) pexelsCache.delete(query);
  return urls;
}

export async function assignImages(items) {
  if (!PEXELS_KEY) return assignLocalImages(items);
  const keys = [...new Set(items.filter(Boolean).map(imageKeyFor))];
  const urlMap = {};
  await Promise.all(keys.map(async (k) => { urlMap[k] = await pexelsUrls(PEXELS_QUERY[k] || k); }));
  const seen = {};
  for (const it of items) {
    if (!it) continue;
    const key = imageKeyFor(it);
    const pool = (urlMap[key] && urlMap[key].length) ? urlMap[key] : poolFor(key);
    const n = (seen[key] = (seen[key] || 0) + 1) - 1;
    it.image = pool[n % pool.length];
  }
  return items;
}
