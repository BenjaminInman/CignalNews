import { CATEGORIES } from "../lib/feeds";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a className="brand" href="/">
          <span className="mark">CIGNAL</span>
          <span className="dot" />
          <span className="kicker">US Economy</span>
        </a>
        <nav className="nav">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`}>
              {c.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
