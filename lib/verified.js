import { getSupabase } from "./supabase";
import { FRED_SERIES, INDICATORS } from "./indicators";

// Verified layer — deterministic, no LLM. Pulls the latest observation of each
// mapped FRED series and upserts it into verified_indicators. This is the hard
// truth the Field Intel layer is never allowed to override.

async function latestObservation(series) {
  const key = process.env.FRED_API_KEY;
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${series}&api_key=${key}&file_type=json&sort_order=desc&limit=2`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const obs = (data.observations || []).filter((o) => o.value !== ".");
  if (!obs.length) return null;
  const [curr, prev] = obs;
  const value = Number(curr.value);
  if (!Number.isFinite(value)) return null;
  let direction = null;
  if (prev && prev.value !== ".") {
    const p = Number(prev.value);
    direction = value > p ? "up" : value < p ? "down" : "flat";
  }
  return { value, period: curr.date, direction };
}

export async function syncVerifiedFromFRED() {
  const sb = getSupabase();
  if (!sb || !process.env.FRED_API_KEY) return { synced: 0, skipped: true };
  let synced = 0;
  for (const { series, indicator, source } of FRED_SERIES) {
    try {
      const obs = await latestObservation(series);
      if (!obs) continue;
      const meta = INDICATORS[indicator] || {};
      const row = {
        indicator,
        label: meta.label || indicator,
        category: meta.category || null,
        cycle_class: meta.cycle_class || null,
        value: obs.value,
        unit: meta.unit || null,
        geography: "US",
        period: obs.period,
        direction: obs.direction,
        source_name: source,
        source_url: `https://fred.stlouisfed.org/series/${series}`,
      };
      // Idempotent: unique (indicator, geography, period, source_name)
      const { error } = await sb
        .from("verified_indicators")
        .upsert(row, { onConflict: "indicator,geography,period,source_name" });
      if (!error) synced += 1;
    } catch {
      /* skip this series, continue */
    }
  }
  return { synced, skipped: false };
}
