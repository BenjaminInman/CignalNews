import { CATEGORIES } from "../lib/feeds";

export default function Footer() {
  return (
    <footer className="site-footer"><div className="wrap">
      <div className="foot-top">
        <div>
          <div className="mark">Cignal<b> News</b></div>
          <p>The latest US economic headlines from primary sources and major publishers, organized by where each theme sits in the market cycle. Every headline links to its original source.</p>
        </div>
        <div className="foot-col">
          <h4>Sections</h4>
          {CATEGORIES.map((c) => (<a key={c.id} href={`#${c.id}`}>{c.label}</a>))}
        </div>
        <div className="foot-col">
          <h4>Sources</h4>
          <a href="#brief">Weekly brief</a>
          <a href="https://www.federalreserve.gov" target="_blank" rel="noopener noreferrer">Federal Reserve</a>
          <a href="https://www.bls.gov" target="_blank" rel="noopener noreferrer">BLS</a>
          <a href="https://www.bea.gov" target="_blank" rel="noopener noreferrer">BEA</a>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Cignal News</span>
        <span>Headlines are aggregated and link to their original publishers.</span>
      </div>
    </div></footer>
  );
}
