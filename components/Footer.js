import { CATEGORIES } from "../lib/feeds";

const SYSTEM_URL = "https://multifamily.cignalsystem.com";

const SOCIAL = {
  x: <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8-9.2L1 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L7.1 4H5.1l12.6 16z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />,
  linkedin: <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.51a2.5 2.5 0 0 1 4.98-.01zM.2 8h4.6v13H.2zm7.5 0h4.4v1.8h.06c.61-1.1 2.1-2.27 4.3-2.27 4.6 0 5.45 3 5.45 6.9V21h-4.6v-5.78c0-1.38-.03-3.15-1.92-3.15-1.92 0-2.22 1.5-2.22 3.05V21H7.7z" />,
  instagram: <><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.6" cy="6.4" r="1.3" /></>,
  youtube: <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.26 5 12 5 12 5s-7.26 0-8.83.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.74 19 12 19 12 19s7.26 0 8.83-.53A2.5 2.5 0 0 0 22.6 16.7C23 15.2 23 12 23 12zM9.75 15.27V8.73L15.5 12z" />,
};

export default function Footer() {
  return (
    <footer className="site-footer" id="about"><div className="wrap">
      <div className="foot-grid">
        <div>
          <div className="about-mark">CIGNAL<span className="middot" />NEWS</div>
          <p>Non-biased US economic news, organized by where each theme sits in the market cycle. Every headline links to its original source.</p>
          <div className="foot-social">
            {Object.entries(SOCIAL).map(([k, svg]) => (
              <a key={k} href="#" aria-label={k} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor">{svg}</svg></a>
            ))}
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
          <h4>Cignal System</h4>
          <a href={SYSTEM_URL} target="_blank" rel="noopener noreferrer">Multifamily</a>
          <a href="https://cignalscore.com" target="_blank" rel="noopener noreferrer">Cignal Score</a>
          <a href="#brief">Weekly brief</a>
        </div>
      </div>
      <a className="family-strip" href={SYSTEM_URL} target="_blank" rel="noopener noreferrer">
        <span className="fs-mark">CIGNAL<span className="middot" />SYSTEM</span>
        <span className="fs-text">Cignal News is part of the Cignal System — market-cycle intelligence across industries. Explore the platform ↗</span>
      </a>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Cignal News · part of the Cignal System</span>
        <span>Data is indicative. Not investment advice. Always verify with primary sources.</span>
      </div>
    </div></footer>
  );
}
