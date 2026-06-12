import { CATEGORIES } from "../lib/feeds";

const SYSTEM_URL = "https://multifamily.cignalsystem.com";

export default function Header() {
  return (
    <header className="site-header"><div className="wrap">
      <div className="nav-top">
        <a className="family-link" href={SYSTEM_URL} target="_blank" rel="noopener noreferrer">Part of the Cignal System ↗</a>
        <a href="/">Home</a>
        <a href="#brief">Brief</a>
        <a href="#sources">Sources</a>
        <a href="#about">About</a>
        <span className="search-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          Search
        </span>
      </div>
      <div className="wordmark"><div className="w">CIGNAL<span className="middot" />NEWS</div></div>
      <nav className="catbar">
        <a href="/">All</a>
        {CATEGORIES.map((c) => (<a key={c.id} href={`#${c.id}`}>{c.label}</a>))}
        <a className="sub" href="#brief">Subscribe</a>
      </nav>
    </div></header>
  );
}
