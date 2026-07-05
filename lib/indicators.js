// Canonical indicator taxonomy for the Cignal field-intelligence pipeline.
// Both the deterministic Verified layer (FRED) and the LLM Field Intel layer map
// onto these keys so everything is queryable by the same vocabulary — organized
// around the leading / coincident / lagging (+ policy) cycle framework.

export const CYCLE_CLASSES = ["leading", "coincident", "lagging", "policy"];
export const RE_CATEGORIES = ["housing", "multifamily", "commercial", "rates", "policy", "capital"];

// Canonical indicators the extractor should map to when it can. `other` is allowed
// for anything genuinely outside this list (stored with lower confidence).
export const INDICATORS = {
  // Rates & lending
  mortgage_rate_30yr:        { label: "30-year fixed mortgage rate", category: "rates", cycle_class: "leading",   unit: "%" },
  mortgage_rate_15yr:        { label: "15-year fixed mortgage rate", category: "rates", cycle_class: "leading",   unit: "%" },
  fed_funds_rate:            { label: "Federal funds rate",          category: "rates", cycle_class: "policy",    unit: "%" },
  treasury_10yr:             { label: "10-year Treasury yield",      category: "rates", cycle_class: "leading",   unit: "%" },
  mortgage_delinquency_rate: { label: "Mortgage delinquency rate",   category: "rates", cycle_class: "lagging",   unit: "%" },
  cre_lending_volume:        { label: "CRE lending volume",          category: "rates", cycle_class: "leading",   unit: "usd" },
  // Housing
  home_price_index:          { label: "Home price index",            category: "housing", cycle_class: "coincident", unit: "index" },
  median_home_price:         { label: "Median home price",           category: "housing", cycle_class: "coincident", unit: "usd" },
  existing_home_sales:       { label: "Existing-home sales",         category: "housing", cycle_class: "coincident", unit: "count" },
  new_home_sales:            { label: "New-home sales",              category: "housing", cycle_class: "leading",   unit: "count" },
  housing_starts:            { label: "Housing starts",              category: "housing", cycle_class: "leading",   unit: "count" },
  building_permits:          { label: "Building permits",            category: "housing", cycle_class: "leading",   unit: "count" },
  months_supply:             { label: "Months' supply of inventory", category: "housing", cycle_class: "leading",   unit: "months" },
  // Multifamily
  apartment_vacancy_rate:    { label: "Apartment vacancy rate",      category: "multifamily", cycle_class: "coincident", unit: "%" },
  rental_vacancy_rate:       { label: "Rental vacancy rate",         category: "multifamily", cycle_class: "coincident", unit: "%" },
  rent_growth:               { label: "Rent growth",                 category: "multifamily", cycle_class: "coincident", unit: "%" },
  multifamily_starts:        { label: "Multifamily starts",          category: "multifamily", cycle_class: "leading",   unit: "count" },
  multifamily_cap_rate:      { label: "Multifamily cap rate",        category: "multifamily", cycle_class: "leading",   unit: "%" },
  multifamily_transaction_volume: { label: "Multifamily transaction volume", category: "multifamily", cycle_class: "coincident", unit: "usd" },
  // Commercial
  office_vacancy_rate:       { label: "Office vacancy rate",         category: "commercial", cycle_class: "lagging", unit: "%" },
  industrial_vacancy_rate:   { label: "Industrial vacancy rate",     category: "commercial", cycle_class: "lagging", unit: "%" },
  retail_vacancy_rate:       { label: "Retail vacancy rate",         category: "commercial", cycle_class: "lagging", unit: "%" },
  cre_price_index:           { label: "CRE price index",             category: "commercial", cycle_class: "lagging", unit: "index" },
  cap_rate:                  { label: "Cap rate",                    category: "commercial", cycle_class: "leading", unit: "%" },
  cre_transaction_volume:    { label: "CRE transaction volume",      category: "commercial", cycle_class: "coincident", unit: "usd" },
  cre_delinquency_rate:      { label: "CRE loan delinquency rate",   category: "commercial", cycle_class: "lagging", unit: "%" },
  // Capital markets
  reit_index:                { label: "REIT index level",            category: "capital", cycle_class: "leading",   unit: "index" },
  cmbs_spread:               { label: "CMBS spread",                 category: "capital", cycle_class: "leading",   unit: "bps" },
  cmbs_issuance:             { label: "CMBS issuance",               category: "capital", cycle_class: "coincident", unit: "usd" },
  distress_volume:           { label: "Distressed asset volume",     category: "capital", cycle_class: "lagging",   unit: "usd" },
  // Macro that moves real estate
  cpi:                       { label: "Consumer Price Index",        category: "rates",   cycle_class: "lagging",    unit: "index" },
  unemployment_rate:         { label: "Unemployment rate",           category: "rates",   cycle_class: "lagging",    unit: "%" },
  gdp_growth:                { label: "GDP growth",                  category: "capital", cycle_class: "coincident", unit: "%" },
  construction_spending:     { label: "Construction spending",       category: "housing", cycle_class: "coincident", unit: "usd" },
  // Policy actions are usually qualitative
  policy_action:             { label: "Real-estate policy action",   category: "policy",  cycle_class: "policy",     unit: "text" },
};

// FRED series -> canonical indicator. This is the deterministic Verified layer
// (no LLM). Add series as needed; each id below is a standard FRED series.
export const FRED_SERIES = [
  { series: "MORTGAGE30US", indicator: "mortgage_rate_30yr", source: "Freddie Mac (FRED)" },
  { series: "MORTGAGE15US", indicator: "mortgage_rate_15yr", source: "Freddie Mac (FRED)" },
  { series: "FEDFUNDS",     indicator: "fed_funds_rate",     source: "Federal Reserve (FRED)" },
  { series: "DGS10",        indicator: "treasury_10yr",      source: "U.S. Treasury (FRED)" },
  { series: "UNRATE",       indicator: "unemployment_rate",  source: "BLS (FRED)" },
  { series: "HOUST",        indicator: "housing_starts",     source: "Census (FRED)" },
  { series: "PERMIT",       indicator: "building_permits",   source: "Census (FRED)" },
  { series: "CSUSHPINSA",   indicator: "home_price_index",   source: "S&P Case-Shiller (FRED)" },
  { series: "RRVRUSQ156N",  indicator: "rental_vacancy_rate",source: "Census (FRED)" },
  { series: "MSACSR",       indicator: "months_supply",      source: "Census (FRED)" },
];

export function indicatorMeta(key) {
  return INDICATORS[key] || null;
}
