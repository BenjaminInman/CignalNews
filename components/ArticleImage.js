"use client";
import { useState } from "react";

// License-free atmospheric imagery (Lorem Picsum, Unsplash-sourced, free to embed),
// seeded by headline so each story keeps a stable image, and tinted in the section
// color so the grid reads as one cohesive magazine. If an image ever fails to load,
// it falls back to a clean color panel — so a card is never visibly broken.
export default function ArticleImage({ title, color, label, ratio = "16/10" }) {
  const [failed, setFailed] = useState(false);
  const seed =
    encodeURIComponent((title || "cignal").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)) || "cignal";
  const src = `https://picsum.photos/seed/${seed}/900/600`;

  return (
    <div className="art" style={{ aspectRatio: ratio }}>
      {!failed && (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className="art-tint" style={{ background: color }} />
      {failed && (
        <span className="art-fallback" style={{ background: color }}>
          {label}
        </span>
      )}
    </div>
  );
}
