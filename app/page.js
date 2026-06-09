import { getNews, CATEGORIES, INDICATOR_COLORS } from "../lib/feeds";
import { timeAgo, shortDate, fullDate, catLabel } from "../lib/format";
import Header from "../components/Header";
import Ticker from "../components/Ticker";
import ArticleImage from "../components/ArticleImage";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const indLabel = { leading: "Leading", lagging: "Lagging", coincident: "Coincident", policy: "Policy" };

function CalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function TagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v5l9 9 5-5-9-9H3z"/><circle cx="7" cy="11" r="1.4" fill="currentColor"/></svg>;
}

function Card({ item }) {
  const c = catOf(item.category);
  return (
    <a className="card" href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="card-img">
        <ArticleImage title={item.title} color={c.color} label={c.label} />
        {item.official && <span className="badge">Primary source</span>}
      </div>
      <div className="kicker"><span className="cat">{c.label}</span><span className="sep">|</span><span className="date">{shortDate(item.date)}</span></div>
      <h3>{item.title}</h3>
      <div className="src">{item.source}</div>
    </a>
  );
}

export default async function Home() {
  const { items, usingFallback } = await getNews();
  const lead = items[0];
  const leadCat = catOf(lead.category);
  const highlight = items.slice(1, 5);
  const featLatest = items[5];
  const sideLatest = items.slice(6, 9);
  const focusMain = items[9];
  const focusSide = items.slice(10, 12);
  const byCat = (id) => items.filter((it) => it.category === id);

  return (
    <>
      <Header />
      <div className="wrap">

        {/* HERO */}
        <section className="panel hero-panel">
          <span className="fold" />
          <Ticker items={items} />
          <a href={lead.link} target="_blank" rel="noopener noreferrer">
            <div className="hero-img"><ArticleImage title={lead.title} color={leadCat.color} label={leadCat.label} /></div>
          </a>
          <div className="hero-meta">
            <span className="m"><CalIcon /> {fullDate(lead.date) || "Today"}</span>
            <span className="m cat"><TagIcon /> {leadCat.label}</span>
          </div>
          <h1><a href={lead.link} target="_blank" rel="noopener noreferrer">{lead.title}</a></h1>
          <div className="hero-src">{lead.source}</div>
          {usingFallback && <p className="fallback-note">Live feeds are warming up — placeholder content shown. This resolves automatically once feeds respond.</p>}
        </section>

        {/* HIGHLIGHT */}
        {highlight.length > 0 && (
          <section className="panel">
            <div className="sec-head"><h2>Highlight</h2><a className="viewall" href="#markets">View all</a></div>
            <div className="grid4">{highlight.map((it, i) => <Card key={i} item={it} />)}</div>
          </section>
        )}

        {/* LATEST + sidebar */}
        {featLatest && (
          <section className="panel">
            <div className="sec-head"><h2>Latest</h2><span className="ind" style={{ marginLeft: "auto" }}>{items.length} tracked</span></div>
            <div className="latest-grid">
              <a className="card feature" href={featLatest.link} target="_blank" rel="noopener noreferrer">
                <div className="card-img"><ArticleImage title={featLatest.title} color={catOf(featLatest.category).color} label={catOf(featLatest.category).label} />{featLatest.official && <span className="badge">Primary source</span>}</div>
                <div className="kicker"><span className="cat">{catOf(featLatest.category).label}</span><span className="sep">|</span><span className="date">{shortDate(featLatest.date)}</span></div>
                <h3>{featLatest.title}</h3>
                <div className="src">{featLatest.source}</div>
              </a>
              <div className="side-stack">
                {sideLatest.map((it, i) => {
                  const c = catOf(it.category);
                  return (
                    <a className="card side-row" key={i} href={it.link} target="_blank" rel="noopener noreferrer">
                      <div className="card-img"><ArticleImage title={it.title} color={c.color} label={c.label} /></div>
                      <div>
                        <div className="kicker" style={{ margin: "0 0 6px" }}><span className="cat">{c.label}</span></div>
                        <h3>{it.title}</h3>
                      </div>
                    </a>
                  );
                })}
                <Newsletter variant="box" />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* DARK "IN FOCUS" BAND */}
      {focusMain && (
        <section className="band"><div className="wrap">
          <div className="focus-mini">in focus<span className="acc">.</span></div>
          <div className="focus-grid">
            <a className="focus-main" href={focusMain.link} target="_blank" rel="noopener noreferrer">
              <div className="card-img"><ArticleImage title={focusMain.title} color={catOf(focusMain.category).color} label={catOf(focusMain.category).label} /></div>
              <div className="focus-kicker">{catOf(focusMain.category).label}</div>
              <h3>{focusMain.title}</h3>
            </a>
            <div className="focus-side-list">
              {focusSide.map((it, i) => (
                <a className="focus-side" key={i} href={it.link} target="_blank" rel="noopener noreferrer">
                  <div className="card-img"><ArticleImage title={it.title} color={catOf(it.category).color} label={catOf(it.category).label} /></div>
                  <div className="focus-kicker">{catOf(it.category).label}</div>
                  <h3>{it.title}</h3>
                </a>
              ))}
            </div>
          </div>
        </div></section>
      )}

      {/* CATEGORY PANELS */}
      <div className="wrap">
        {CATEGORIES.map((cat) => {
          const catItems = byCat(cat.id).slice(0, 3);
          if (catItems.length === 0) return null;
          return (
            <section className="panel" id={cat.id} key={cat.id}>
              <div className="sec-head">
                <h2>What&apos;s moving in <span className="red">{cat.label}</span></h2>
                <span className="ind"><span className="d" style={{ background: INDICATOR_COLORS[cat.indicator] }} />{indLabel[cat.indicator]} indicator</span>
                <a className="viewall" href={`#${cat.id}`}>View all</a>
              </div>
              <div className="grid3">{catItems.map((it, i) => <Card key={i} item={it} />)}</div>
            </section>
          );
        })}
      </div>

      {/* SUBSCRIBE MEDIA CARD */}
      <Newsletter variant="media" />

      <Footer />
    </>
  );
}
