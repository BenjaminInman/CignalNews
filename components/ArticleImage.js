"use client";
import { useState } from "react";

// Renders the topical image resolved server-side (see lib/images.js). If the
// image is missing or fails to load, falls back to a clean category color panel
// so a card is never visibly broken.
export default function ArticleImage({ src, color = "#16171b", label = "" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="img-fallback" style={{ background: color }}>{label}</span>;
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
