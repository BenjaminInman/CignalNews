import { getNews, CATEGORIES, INDICATOR_COLORS } from "../lib/feeds";
import { timeAgo, catLabel } from "../lib/format";
import Header from "../components/Header";
import Ticker from "../components/Ticker";
import ArticleImage from "../components/ArticleImage";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

function Indicator({ type }) {
  const labels = { leading: "Leading", lagging: "Lagging", coincident: "Coincident", policy: "Policy" };
  return (
    <span className="ind"><span className="d" style={{ background: INDICATOR_COLORS[type] }} />{labels[type] || type} indicator</span>
  );
}

function Card({ item }) {
  const cat = catOf(item.category);
  return (
    <a className="card" href={item.link} target="_blank" rel="noopener noreferrer">
      <ArticleImage title={item.title} color={cat.color} label={cat.label} />
      <div className="top">
        <span className="tag">{cat.label}</span>
        {item.official && <span className="official">Primary source</span>}
      </div>
      <h3>{item.title}</h3>
      <div className="meta"><span className="src">{item.source}</span><span>·</span><span>{timeAgo(item.date)}</span></div>
    </a>
  );
}

export default async function Home() {
  const { items, usingFallback } = await getNews();
  const lead = items[0];
  const leadCat = catOf(lead.category);
  const side = items.slice(1, 5);
  const highlight = items.slice(5, 8);
  const latest = items.slice(8, 14);

  const byCat = (id) => items.filter((it) => it.category === id);

  return (
    <>
      <Header />
      <Ticker items={items} />
      <main>
        {/* Hero */}
        <section className="hero"><div className="wrap"><div className="hero-grid">
          <div className="hero-main">
            <a href={lead.link} target="_blank" rel="noopener noreferrer">
              <ArticleImage title={lead.title} color={leadCat.color} label={leadCat.label} ratio="16/9" />
            </a>
            <div className="head-row" style={{ marginTop: 18 }}>
              <span className="tag">{leadCat.label}</span>
              <Indicator type={leadCat.indicator} />
            </div>
            <h1><a href={lead.link} target="_blank" rel="noopener noreferrer">{lead.title}</a></h1>
            <div className="meta"><span className="src">{lead.source}</span><span>·</span><span>{timeAgo(lead.date)}</span></div>
            {usingFallback && <p className="fallback-note">Live feeds are warming up — placeholder content shown. This resolves automatically once feeds respond.</p>}
          </div>
          <aside className="hero-side">
            <div className="hero-side-title">Also moving</div>
            {side.map((it, i) => {
              const c = catOf(it.category);
              return (
                <a className="mini" key={i} href={it.link} target="_blank" rel="noopener noreferrer">
                  <ArticleImage title={it.title} color={c.color} label={c.label} ratio="1/1" />
                  <div>
                    <h3>{it.title}</h3>
                    <div className="meta"><span className="tag">{c.label}</span><span>{timeAgo(it.date)}</span></div>
                  </div>
                </a>
              );
            })}
          </aside>
        </div></div></section>

        {/* Highlight */}
        {highlight.length > 0 && (
          <section className="section alt"><div className="wrap">
            <div className="section-head"><h2>Highlight</h2><span className="rule" /></div>
            <div className="highlight">
              <div className="big">
                <Card item={highlight[0]} />
              </div>
              <div className="stack">
                {highlight.slice(1).map((it, i) => <Card key={i} item={it} />)}
              </div>
            </div>
          </div></section>
        )}

        {/* Latest */}
        <section className="section"><div className="wrap">
          <div className="section-head"><h2>Latest</h2><span className="rule" /><span className="meta">{items.length} tracked</span></div>
          <div className="cards">
            {latest.map((it, i) => <Card key={i} item={it} />)}
          </div>
        </div></section>

        {/* Category sections */}
        {CATEGORIES.map((cat, idx) => {
          const catItems = byCat(cat.id).slice(0, 3);
          if (catItems.length === 0) return null;
          return (
            <section className={`section ${idx % 2 === 0 ? "alt" : ""}`} id={cat.id} key={cat.id}><div className="wrap">
              <div className="section-head">
                <h2>What&apos;s moving in {cat.label}</h2>
                <Indicator type={cat.indicator} />
                <span className="rule" />
              </div>
              <div className="cards">
                {catItems.map((it, i) => <Card key={i} item={it} />)}
              </div>
            </div></section>
          );
        })}

        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
