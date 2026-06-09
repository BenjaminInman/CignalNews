"use client";
import { useState } from "react";

// License-free photos (Lorem Picsum / Unsplash-sourced, free to embed), seeded by
// headline so each story keeps a stable image. If a photo fails to load it falls
// back to a clean color panel, so a card is never visibly broken.
export default function ArticleImage({ title, color = "#16171b", label = "" }) {
  const [failed, setFailed] = useState(false);
  const seed =
    encodeURIComponent((title || "cignal").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)) || "cignal";
  const src = `https://picsum.photos/seed/${seed}/1000/700`;
  if (failed) {
    return <span className="img-fallback" style={{ background: color }}>{label}</span>;
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
