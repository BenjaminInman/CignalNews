import { CATEGORIES } from "../lib/feeds";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <div className="header-top">
          <a className="brand" href="/">
            <span className="mark">Cignal<b> News</b></span>
            <span className="dot" />
          </a>
          <div className="header-actions">
            <span className="live"><span className="pulse" /> Live</span>
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
        </div>
        <nav className="catbar">
          <a href="/">Home</a>
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`}>{c.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
