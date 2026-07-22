// EXTRACTION LIMITATION — learned from a live run, 2026-07-22.
// Google News RSS returns wrapped redirect URLs (news.google.com/rss/articles/CBM...).
// Every fetch returns 200 and yields no article text, so these entries are useful
// for CORROBORATION COUNTING — knowing five outlets covered one event — but cannot
// supply facts. Facts must come from primary sources (Census, HUD, Federal Reserve,
// Freddie Mac) or from trade feeds that permit fetching.
// Verified fetchable: Multifamily Dive RSS (but article bodies return 403),
// Bisnow, Yield PRO. Blocked entirely: Multi-Housing News (403), GlobeSt (403),
// Multifamily Executive (404), Propmodo (503), Rental Housing Journal (503).

import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "CignalNews/0.1" },
});

const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(
    q + " when:7d"
  )}&hl=en-US&gl=US&ceid=US:en`;

// US real-estate focus: each vertical is tagged with where it tends to sit in a
// market cycle (leading / coincident / lagging / policy) and a brand color used
// for that section's tags and image fallback.
export const CATEGORIES = [
  { id: "housing", label: "Housing", indicator: "coincident", color: "#0e7c54" },
  { id: "multifamily", label: "Multifamily", indicator: "coincident", color: "#0f766e" },
  { id: "commercial", label: "Commercial", indicator: "lagging", color: "#b45309" },
  { id: "rates", label: "Rates & Lending", indicator: "leading", color: "#1d4ed8" },
  { id: "policy", label: "Policy", indicator: "policy", color: "#6d28d9" },
  { id: "capital", label: "Capital Markets", indicator: "leading", color: "#0369a1" },
  // --- operational feeds for the "run" lens (Multifamily30x) -----------------
  // The queries above are macro-economic. These target what an owner-operator
  // actually decides on; without them nothing relevant to Multifamily30x is
  // ever harvested.
  { source: null, category: "multifamily", lens: "run", op_vertical: "leasing",   url: gnews('multifamily "centralized leasing" OR "leasing office" OR "lead response" OR "tour conversion" apartment') },
  { source: null, category: "multifamily", lens: "run", op_vertical: "turns",     url: gnews('apartment "make ready" OR "turn time" OR "unit turnover" OR "maintenance costs" multifamily') },
  { source: null, category: "multifamily", lens: "run", op_vertical: "staffing",  url: gnews('multifamily "on-site staff" OR "property management staffing" OR "leasing agent" hiring OR turnover') },
  { source: null, category: "multifamily", lens: "run", op_vertical: "systems",   url: gnews('multifamily "property management software" OR "AI leasing" OR "proptech" OR "centralization" operators') },
  { source: null, category: "multifamily", lens: "run", op_vertical: "expenses",  url: gnews('multifamily "operating expenses" OR "insurance costs" OR "payroll" OR "R&M" apartment NOI') },
  { source: null, category: "multifamily", lens: "run", op_vertical: "retention", url: gnews('apartment "resident retention" OR "renewal rate" OR "lease renewal" OR "resident experience"') },
];

export const INDICATOR_COLORS = {
  leading: "#16a35a",
  lagging: "#64748b",
  coincident: "#d2920c",
  policy: "#2563eb",
};

const FEEDS = [
  // Primary sources (authoritative, get the "Primary source" badge)
  { source: "Federal Reserve", category: "rates", official: true, url: "https://www.federalreserve.gov/feeds/press_monetary.xml" },
  { source: "Freddie Mac", category: "rates", official: true, url: "https://freddiemac.gcs-web.com/rss/news-releases.xml" },
  // Real-estate news by vertical (Google News)
  { source: null, category: "housing", url: gnews('US housing market "home prices" OR "home sales" OR "housing inventory" OR "housing starts" OR "building permits"') },
  { source: null, category: "multifamily", url: gnews('US multifamily apartment "rent growth" OR "apartment market" OR "multifamily investment" OR renters') },
  { source: null, category: "commercial", url: gnews('US commercial real estate office OR industrial OR retail OR warehouse vacancy OR leasing') },
  { source: null, category: "rates", url: gnews('US "mortgage rates" OR "Federal Reserve" OR "commercial real estate lending" real estate') },
  { source: null, category: "policy", url: gnews('US real estate "zoning" OR "rent control" OR "property tax" OR "housing legislation" OR "1031 exchange" OR HUD OR FHFA') },
  { source: null, category: "capital", url: gnews('US "REIT" OR "cap rates" OR "real estate investment" OR "CRE" transactions OR "distressed real estate"') },
];

function cleanTitle(raw) {
  if (!raw) return { title: "", source: null };
  const idx = raw.lastIndexOf(" - ");
  if (idx > 20) return { title: raw.slice(0, idx).trim(), source: raw.slice(idx + 3).trim() };
  return { title: raw.trim(), source: null };
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36", "Accept": "application/rss+xml,application/xml,text/xml,*/*" }, next: { revalidate: 600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    return (parsed.items || []).map((item) => {
      const { title, source } = cleanTitle(item.title);
      return {
        title,
        link: item.link,
        source: feed.source || item.creator || source || "Newswire",
        official: !!feed.official,
        category: feed.category,
        date: item.isoDate || item.pubDate || null,
      };
    });
  } catch {
    return [];
  }
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = (it.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getNews() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  let items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  items = items.filter((it) => it.title && it.link);
  items = dedupe(items);
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (items.length === 0) return { items: FALLBACK, usingFallback: true };
  return { items, usingFallback: false };
}

const FALLBACK = Array.from({ length: 12 }).map((_, i) => ({
  title: "Live economic headlines will appear here once feeds respond",
  link: "#",
  source: "Cignal News",
  category: CATEGORIES[i % CATEGORIES.length].id,
  date: new Date().toISOString(),
  official: false,
}));
