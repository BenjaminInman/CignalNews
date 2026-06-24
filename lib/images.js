// Topical imagery for article cards.
//
// Tier 1 (always on): each story is matched to a relevant, public-domain image
//   committed under /public/img/topics by scanning the headline for keywords and
//   falling back to the story's category. No API key required, works on deploy.
//
// Tier 2 (optional): if PEXELS_API_KEY is set, a fresh relevant photo is pulled
//   per story for more variety. Any miss or error falls back to the Tier-1 image,
//   so the site looks right with or without the key (same graceful pattern as the
//   FRED macro strip). Curated Shutterstock picks for hero stories come later.

const IMG = (k) => `/img/topics/${k}.jpg`;

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

const CATEGORY_KEY = {
  markets: "markets",
  fed: "fed",
  housing: "housing",
  jobs: "jobs",
  inflation: "money",
  growth: "growth",
};

const PEXELS_QUERY = {
  fed: "federal reserve building",
  treasury: "us treasury finance bonds",
  capitol: "us capitol congress washington",
  money: "us dollar cash money",
  markets: "stock market trading floor",
  housing: "apartment building exterior",
  jobs: "office workers employment",
  growth: "shipping port cargo economy",
};

export function imageKeyFor({ title = "", category = "" } = {}) {
  const t = (title || "").toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(t)) return rule.key;
  }
  return CATEGORY_KEY[category] || "markets";
}

export function localImageFor(article) {
  return IMG(imageKeyFor(article));
}

// --- Tier 2: optional Pexels enrichment -----------------------------------
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const pexelsCache = new Map(); // query -> Promise<string[]>

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  })();
  pexelsCache.set(query, p);
  const urls = await p;
  if (!urls.length) pexelsCache.delete(query); // don't poison cache on a transient miss
  return urls;
}

export async function resolveImage(article) {
  const key = imageKeyFor(article);
  const local = IMG(key);
  if (!PEXELS_KEY) return local;
  try {
    const urls = await pexelsUrls(PEXELS_QUERY[key] || key);
    if (!urls.length) return local;
    return urls[hashStr(article.title || key) % urls.length];
  } catch {
    return local;
  }
}
