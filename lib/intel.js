import { getSupabase } from "./supabase";

// Read side of the pipeline. Verified data always wins; Field Intel is returned
// separately and clearly labeled as derived, never merged over verified truth.

export async function getIndicator(indicator, { geography = "US", limit = 20 } = {}) {
  const sb = getSupabase();
  if (!sb) return { verified: [], field: [], configured: false };
  const [v, f] = await Promise.all([
    sb.from("verified_indicators").select("*").eq("indicator", indicator).eq("geography", geography).order("period", { ascending: false }).limit(limit),
    sb.from("field_intel").select("*").eq("indicator", indicator).order("extracted_at", { ascending: false }).limit(limit),
  ]);
  return { verified: v.data || [], field: f.data || [], configured: true };
}

// The single best current value for an indicator: the latest Verified observation
// if one exists, otherwise the highest-confidence recent Field Intel point (flagged).
export async function resolveIndicator(indicator, { geography = "US" } = {}) {
  const sb = getSupabase();
  if (!sb) return null;
  const v = await sb.from("verified_indicators").select("*").eq("indicator", indicator).eq("geography", geography).order("period", { ascending: false }).limit(1);
  if (v.data && v.data.length) return { ...v.data[0], layer: "verified" };
  const f = await sb.from("field_intel").select("*").eq("indicator", indicator).order("confidence", { ascending: false }).order("extracted_at", { ascending: false }).limit(1);
  if (f.data && f.data.length) return { ...f.data[0], layer: "field_intel" };
  return null;
}

export async function listByCycle(cycleClass, { layer = "field", limit = 40 } = {}) {
  const sb = getSupabase();
  if (!sb) return [];
  const table = layer === "verified" ? "verified_indicators" : "field_intel";
  const order = layer === "verified" ? "period" : "extracted_at";
  const { data } = await sb.from(table).select("*").eq("cycle_class", cycleClass).order(order, { ascending: false }).limit(limit);
  return data || [];
}

export async function listByCategory(category, { layer = "field", limit = 40 } = {}) {
  const sb = getSupabase();
  if (!sb) return [];
  const table = layer === "verified" ? "verified_indicators" : "field_intel";
  const order = layer === "verified" ? "period" : "extracted_at";
  const { data } = await sb.from(table).select("*").eq("category", category).order(order, { ascending: false }).limit(limit);
  return data || [];
}

export async function recentFieldIntel({ minConfidence = 0, limit = 50 } = {}) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from("field_intel").select("*").gte("confidence", minConfidence).order("extracted_at", { ascending: false }).limit(limit);
  return data || [];
}
