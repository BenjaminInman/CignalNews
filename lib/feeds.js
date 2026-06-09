import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "CignalNews/0.1 (+https://cignalnews.vercel.app)" },
});

// Google News RSS aggregates many publishers and links back to the original
// source — we only ever store the headline, source, and link (never article
// text), which is the correct way to run a news aggregator.
const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(
    q + " when:3d"
  )}&hl=en-US&gl=US&ceid=US:en`;

// indicator types tie each economic theme to where it sits in a market cycle:
// "leading" moves first, "coincident" moves with the cycle, "lagging" confirms it.
export const CATEGORIES = [
  { id: "markets", label: "Markets", indicator: "leading" },
  { id: "fed", label: "The Fed", indicator: "policy" },
  { id: "housing", label: "Housing", indicator: "leading" },
  { id: "jobs", label: "Jobs", indicator: "coincident" },
  { id: "inflation", label: "Inflation", indicator: "lagging" },
  { id: "growth", label: "Growth", indicator: "lagging" },
];

const FEEDS = [
  // Primary-source government feed (public domain).
  {
    source: "Federal Reserve",
    category: "fed",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    official: true,
  },
  // Broad publisher coverage via Google News, one query per economic theme.
  { source: null, category: "markets", url: gnews("US stock market Treasury yields") },
  { source: null, category: "fed", url: gnews("Federal Reserve interest rates FOMC") },
  { source: null, category: "housing", url: gnews("US housing market multifamily real estate") },
  { source: null, category: "jobs", url: gnews("US jobs report employment unemployment") },
  { source: null, category: "inflation", url: gnews("US inflation CPI PCE prices") },
  { source: null, category: "growth", url: gnews("US GDP economic growth") },
];

function cleanTitle(raw) {
  if (!raw) return { title: "", source: null };
  // Google News titles arrive as "Headline - Publisher".
  const idx = raw.lastIndexOf(" - ");
  if (idx > 20) {
    return { title: raw.slice(0, idx).trim(), source: raw.slice(idx + 3).trim() };
  }
  return { title: raw.trim(), source: null };
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "CignalNews/0.1" },
      // cache fetched feeds for 10 minutes so the site stays fast
      next: { revalidate: 600 },
    });
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

// Shown only if every live feed is unreachable, so the page never looks broken.
const FALLBACK = [
  { title: "Feeds are warming up — live economic headlines will appear here", link: "#", source: "Cignal", category: "markets", date: new Date().toISOString(), official: false },
];
