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
];

export const INDICATOR_COLORS = {
  leading: "#16a35a",
  lagging: "#64748b",
  coincident: "#d2920c",
  policy: "#2563eb",
};

const FEEDS = [
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
    const res = await fetch(feed.url, { headers: { "User-Agent": "CignalNews/0.1" }, next: { revalidate: 600 } });
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
