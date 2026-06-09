import { CATEGORIES } from "../lib/feeds";
import { catLabel } from "../lib/format";

export default function Ticker({ items }) {
  const feed = items.slice(0, 14);
  const loop = [...feed, ...feed];
  return (
    <div className="ticker" aria-label="Latest economic headlines">
      <div className="ticker-label"><span className="pulse" /> Signal</div>
      <div className="ticker-track">
        {loop.map((it, i) => (
          <a key={i} className="ticker-item" href={it.link} target="_blank" rel="noopener noreferrer">
            <span className="c">{catLabel(it.category, CATEGORIES)}</span>
            <span>{it.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
