import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "CignalNews/0.1" },
});

const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(
    q + " when:3d"
  )}&hl=en-US&gl=US&ceid=US:en`;

// Each economic theme is tagged with where it tends to sit in a market cycle and
// a brand color used for that section's imagery and tags.
export const CATEGORIES = [
  { id: "markets", label: "Markets", indicator: "leading", color: "#1d4ed8" },
  { id: "fed", label: "The Fed", indicator: "policy", color: "#6d28d9" },
  { id: "housing", label: "Housing", indicator: "leading", color: "#0e7c54" },
  { id: "jobs", label: "Jobs", indicator: "coincident", color: "#b45309" },
  { id: "inflation", label: "Inflation", indicator: "lagging", color: "#be123c" },
  { id: "growth", label: "Growth", indicator: "lagging", color: "#0f766e" },
];

export const INDICATOR_COLORS = {
  leading: "#16a35a",
  lagging: "#64748b",
  coincident: "#d2920c",
  policy: "#2563eb",
};

const FEEDS = [
  { source: "Federal Reserve", category: "fed", url: "https://www.federalreserve.gov/feeds/press_all.xml", official: true },
  { source: null, category: "markets", url: gnews("US stock market Treasury yields") },
  { source: null, category: "fed", url: gnews("Federal Reserve interest rates FOMC") },
  { source: null, category: "housing", url: gnews("US housing market multifamily real estate") },
  { source: null, category: "jobs", url: gnews("US jobs report employment unemployment") },
  { source: null, category: "inflation", url: gnews("US inflation CPI PCE prices") },
  { source: null, category: "growth", url: gnews("US GDP economic growth") },
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
