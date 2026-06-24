import { CATEGORIES } from "../lib/feeds";

const SYSTEM_URL = "https://cignalsystem.com";

export default function Header() {
  return (
    <header className="site-header"><div className="wrap">
      <div className="nav-bar">
        <a className="brand" href="/" aria-label="Cignal News — home">
          <span className="brand-mark">CIGNAL<span className="middot" />NEWS</span>
        </a>
        <nav className="nav-main">
          <a href="/">Home</a>
          <a href="#brief">Brief</a>
          <a href="#sources">Sources</a>
          <a href="#about">About</a>
        </nav>
        <div className="nav-actions">
          <span className="search-btn" role="button" tabIndex={0} aria-label="Search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </span>
          <a className="family-link" href={SYSTEM_URL} target="_blank" rel="noopener noreferrer">Cignal System ↗</a>
          <a className="btn-cta" href="#brief">Subscribe</a>
        </div>
      </div>
      <nav className="catbar">
        <a href="/">All</a>
        {CATEGORIES.map((c) => (<a key={c.id} href={`#${c.id}`}>{c.label}</a>))}
      </nav>
    </div></header>
  );
}
