// LIVE macro strip data.
//
// If a FRED API key is present (env var FRED_API_KEY), getMacro() pulls the latest
// values live from the St. Louis Fed (FRED) and computes each delta. Without a key,
// or if the fetch fails, it falls back to the indicative snapshot below — so the
// strip always renders. Get a free key at https://fredaccount.stlouisfed.org/apikeys
// and add it in Vercel → Settings → Environment Variables as FRED_API_KEY.

export const MACRO = [
  { label: "10Y Treasury", value: "4.41%", delta: "-3bps", dir: "down" },
  { label: "Fed Funds", value: "4.33%", delta: "0bps", dir: "flat" },
  { label: "CPI (YoY)", value: "2.9%", delta: "-0.1%", dir: "down" },
  { label: "Core PCE", value: "2.7%", delta: "-0.1%", dir: "down" },
  { label: "Unemployment", value: "4.2%", delta: "+0.1%", dir: "up" },
  { label: "S&P 500", value: "5,831", delta: "+0.6%", dir: "up" },
  { label: "30Y Mortgage", value: "6.72%", delta: "-5bps", dir: "down" },
  { label: "WTI Crude", value: "$71.40", delta: "-1.2%", dir: "down" },
];

// id = FRED series, units = optional FRED transform (pc1 = % change year ago),
// fmt = how to print the value, delta = how to print the change, dp = decimals.
const SERIES = [
  { id: "DGS10", label: "10Y Treasury", fmt: "pct", delta: "bps", dp: 2 },
  { id: "DFF", label: "Fed Funds", fmt: "pct", delta: "bps", dp: 2 },
  { id: "CPIAUCSL", label: "CPI (YoY)", units: "pc1", fmt: "pct", delta: "pp", dp: 1 },
  { id: "PCEPILFE", label: "Core PCE", units: "pc1", fmt: "pct", delta: "pp", dp: 1 },
  { id: "UNRATE", label: "Unemployment", fmt: "pct", delta: "pp", dp: 1 },
  { id: "MORTGAGE30US", label: "30Y Mortgage", fmt: "pct", delta: "bps", dp: 2 },
  { id: "SP500", label: "S&P 500", fmt: "num", delta: "pct" },
  { id: "DCOILWTICO", label: "WTI Crude", fmt: "usd", delta: "pct", dp: 2 },
];

function fmtValue(v, fmt, dp = 2) {
  if (fmt === "num") return Math.round(v).toLocaleString("en-US");
  if (fmt === "usd") return "$" + v.toFixed(dp);
  return v.toFixed(dp) + "%";
}

function fmtDelta(latest, prev, kind, dp = 1) {
  const d = latest - prev;
  const near = (n) => Math.abs(n) < (kind === "bps" ? 0.5 : kind === "pct" ? 0.05 : 0.005);
  if (kind === "bps") {
    const bps = Math.round(d * 100);
    return { delta: `${bps >= 0 ? "+" : ""}${bps}bps`, dir: bps > 0 ? "up" : bps < 0 ? "down" : "flat" };
  }
  if (kind === "pct") {
    const p = prev ? (d / prev) * 100 : 0;
    return { delta: `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`, dir: near(p) ? "flat" : p > 0 ? "up" : "down" };
  }
  // pp (percentage points) — printed with a % sign to mirror the companion site
  return { delta: `${d >= 0 ? "+" : ""}${d.toFixed(dp)}%`, dir: near(d) ? "flat" : d > 0 ? "up" : "down" };
}

async function fetchSeries(s, key) {
  try {
    const url =
      `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}` +
      `&api_key=${key}&file_type=json&sort_order=desc&limit=30` +
      (s.units ? `&units=${s.units}` : "");
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const vals = (data.observations || []).map((o) => parseFloat(o.value)).filter((v) => !isNaN(v));
    if (vals.length < 2) return null;
    const [latest, prev] = vals;
    return { label: s.label, value: fmtValue(latest, s.fmt, s.dp), ...fmtDelta(latest, prev, s.delta, s.dp) };
  } catch {
    return null;
  }
}

export async function getMacro() {
  const key = process.env.FRED_API_KEY;
  if (!key) return MACRO;
  const results = await Promise.allSettled(SERIES.map((s) => fetchSeries(s, key)));
  const items = results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean);
  // fall back to the static snapshot if too few series came back
  return items.length >= 4 ? items : MACRO;
}
