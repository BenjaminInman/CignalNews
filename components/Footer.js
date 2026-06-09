import { CATEGORIES } from "../lib/feeds";

export default function Footer() {
  return (
    <footer className="site-footer" id="about"><div className="wrap">
      <div className="foot-grid">
        <div>
          <div className="about-mark">CIGNAL NEWS<span className="acc">.</span></div>
          <p>The latest US economic headlines from primary sources and major publishers, organized by where each theme sits in the market cycle. Every headline links to its original source.</p>
        </div>
        <div>
          <h4>Sections</h4>
          {CATEGORIES.map((c) => (<a key={c.id} href={`#${c.id}`}>{c.label}</a>))}
        </div>
        <div id="sources">
          <h4>Sources</h4>
          <a href="https://www.federalreserve.gov" target="_blank" rel="noopener noreferrer">Federal Reserve</a>
          <a href="https://www.bls.gov" target="_blank" rel="noopener noreferrer">BLS</a>
          <a href="https://www.bea.gov" target="_blank" rel="noopener noreferrer">BEA</a>
        </div>
        <div>
          <h4>More</h4>
          <a href="#brief">Weekly brief</a>
          <a href="/">Latest</a>
        </div>
      </div>
      <p className="foot-about">Cignal News aggregates US economic news so investors and operators can read the market cycle at a glance — distinguishing leading indicators that move first from lagging ones that confirm a trend. Headlines are sourced from public feeds and link to their original publishers; Cignal News stores no article text.</p>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Cignal News</span>
        <span>Headlines aggregated from public feeds · link to original publishers</span>
      </div>
    </div></footer>
  );
}
