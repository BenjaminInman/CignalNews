// Indicative US macro snapshot for the LIVE strip. These are placeholders you can
// update by hand, or wire to a free feed (e.g. FRED) later. Direction colors the
// delta: "up" = green, "down" = red. The footer carries a "data is indicative" note.
export const MACRO = [
  { label: "10Y Treasury", value: "4.41%", delta: "-3bps", dir: "down" },
  { label: "Fed Funds", value: "4.25%", delta: "0bps", dir: "flat" },
  { label: "CPI (YoY)", value: "2.9%", delta: "-0.1%", dir: "down" },
  { label: "Core PCE", value: "2.7%", delta: "-0.1%", dir: "down" },
  { label: "Unemployment", value: "4.2%", delta: "+0.1%", dir: "up" },
  { label: "S&P 500", value: "5,831", delta: "+0.6%", dir: "up" },
  { label: "30Y Mortgage", value: "6.72%", delta: "-5bps", dir: "down" },
  { label: "WTI Crude", value: "$71.40", delta: "-1.2%", dir: "down" },
];
