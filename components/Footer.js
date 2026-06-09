import { CATEGORIES } from "../lib/feeds";

export default function Footer() {
  return (
    <footer className="site-footer" id="about"><div className="wrap">
      <div className="foot-grid">
        <div>
          <div className="about-mark">CIGNAL<span className="middot" />NEWS</div>
          <p>The latest US economic headlines from primary sources and major publishers, organized by where each theme sits in the market cycle. Every headline links to its original source.</p>
          <div className="foot-social">
            <a href="#" aria-label="X" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8-9.2L1 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L7.1 4H5.1l12.6 16z"/></svg></a>
            <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></a>
            <a href="#" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.51a2.5 2.5 0 0 1 4.98-.01zM.2 8h4.6v13H.2zm7.5 0h4.4v1.8h.06c.61-1.1 2.1-2.27 4.3-2.27 4.6 0 5.45 3 5.45 6.9V21h-4.6v-5.78c0-1.38-.03-3.15-1.92-3.15-1.92 0-2.22 1.5-2.22 3.05V21H7.7z"/></svg></a>
            <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.26 5 12 5 12 5s-7.26 0-8.83.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.74 19 12 19 12 19s7.26 0 8.83-.53A2.5 2.5 0 0 0 22.6 16.7C23 15.2 23 12 23 12zM9.75 15.27V8.73L15.5 12z"/></svg></a>
          </div>
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
