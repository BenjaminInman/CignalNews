// Topical imagery for article cards.
//
// Tier 1 (always on): each story is matched to a topic by scanning its headline
//   for keywords, then the story's category. Every topic has a small POOL of
//   distinct public-domain / CC0 images committed under /public/img/topics, and
//   images are assigned by ROTATION across a render so two same-topic stories on
//   the page never share a photo. No API key required.
//
// Tier 2 (optional): if PEXELS_API_KEY is set, photos are pulled per topic for
//   more variety (also rotated, so no repeats). Any miss/error falls back to the
//   Tier-1 pool, so the site looks right with or without the key (FRED pattern).
//   Curated Shutterstock picks for hero stories come later.

const P = (k) => `/img/topics/${k}.jpg`;

// Each topic has multiple images. Pools are sized so the up-to-3 stories shown in
// a category section never repeat; where fewer originals exist, the pool borrows a
// related finance image (e.g. markets -> Treasury) rather than repeat.
const POOL = {
  fed:      [P("fed"), P("fed-2"), P("fed-3")],
  treasury: [P("treasury"), P("money"), P("markets-2")],
  capitol:  [P("capitol"), P("capitol-2"), P("capitol-3")],
  money:    [P("money"), P("money-2"), P("money-3")],
  markets:  [P("markets"), P("markets-2"), P("treasury")],
  housing:  [P("housing"), P("housing-2"), P("housing-3")],
  jobs:     [P("jobs"), P("jobs-2"), P("jobs-3")],
  growth:   [P("growth"), P("growth-2"), P("growth-3")],
};

// Checked in order, first match wins. Specific themes above broad ones.
const KEYWORD_RULES = [
  { key: "fed",      re: /\b(fed|fomc|powell|rate cut|rate hike|interest rate|monetary policy|central bank|basis points?)\b/ },
  { key: "treasury", re: /\b(treasury|treasuries|yield|yields|bond|bonds|10[- ]year|2[- ]year|debt market)\b/ },
  { key: "capitol",  re: /\b(congress|senate|capitol|fiscal|debt ceiling|budget|tariff|tariffs|stimulus|shutdown|white house|legislation)\b/ },
  { key: "money",    re: /\b(inflation|cpi|pce|consumer price|prices|cost of living|deflation|disinflation)\b/ },
  { key: "housing",  re: /\b(housing|mortgage|home price|home sales|apartment|apartments|multifamily|rent|rents|construction|building permits?|homebuild|real estate|landlord)\b/ },
  { key: "jobs",     re: /\b(jobs?|employ\w*|payrolls?|unemployment|labor|hiring|layoffs?|wage|wages|workforce|jobless)\b/ },
  { key: "markets",  re: /\b(stocks?|s&p|nasdaq|dow|equit\w*|wall street|shares|index|indices|rally|sell[- ]off)\b/ },
  { key: "growth",   re: /\b(gdp|growth|recession|trade|exports?|imports?|manufactur\w*|economy|economic|spending|retail sales)\b/ },
];

const CATEGORY_KEY = { markets: "markets", fed: "fed", housing: "housing", jobs: "jobs", inflation: "money", growth: "growth" };

// When a topic shows more cards on a page than it has images, spill over into
// related finance imagery (in this order) rather than repeat. Keeps every visible
// card distinct while staying on-theme.
const NEIGHBORS = {
  markets:  ["money", "treasury", "growth"],
  fed:      ["treasury", "capitol", "money"],
  housing:  ["growth", "markets"],
  jobs:     ["growth", "housing"],
  money:    ["treasury", "markets"],
  growth:   ["markets", "housing"],
  treasury: ["money", "markets", "capitol"],
  capitol:  ["fed", "treasury"],
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
  fed: "federal reserve building", treasury: "us treasury finance bonds",
  capitol: "us capitol congress washington", money: "us dollar cash money",
  markets: "stock market trading floor", housing: "apartment building exterior",
  jobs: "office workers employment", growth: "shipping port cargo economy",
};

export function imageKeyFor({ title = "", category = "" } = {}) {
  const t = (title || "").toLowerCase();
  for (const rule of KEYWORD_RULES) if (rule.re.test(t)) return rule.key;
  return CATEGORY_KEY[category] || "markets";
}

function poolFor(key) { return SEQ[key] || SEQ.markets; }

// Sync, local-only assignment with per-topic rotation. Used for fallback content
// and whenever no Pexels key is configured.
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

// Assign an image to every item, rotating per topic so no same-topic story repeats.
// With a Pexels key, pulls from Pexels (falling back to the local pool per topic).
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
