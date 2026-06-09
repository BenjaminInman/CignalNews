import { getNews, CATEGORIES } from "../lib/feeds";
import { timeAgo, catLabel } from "../lib/format";
import Header from "../components/Header";
import Ticker from "../components/Ticker";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

// Render at request time so the latest headlines always show (and so the
// production build never needs network access while building).
export const dynamic = "force-dynamic";

function IndicatorTag({ type }) {
  const labels = {
    leading: "Leading indicator",
    lagging: "Lagging indicator",
    coincident: "Coincident indicator",
    policy: "Policy signal",
  };
  return <span className={`ind ${type}`}>{labels[type] || type}</span>;
}

function Card({ item }) {
  return (
    <a className="card" href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="top">
        <span className="cat-tag">{catLabel(item.category, CATEGORIES)}</span>
        {item.official && <span className="official">Primary source</span>}
      </div>
      <h3>{item.title}</h3>
      <div className="meta">
        <span className="src">{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.date)}</span>
      </div>
    </a>
  );
}

export default async function Home() {
  const { items, usingFallback } = await getNews();

  const lead = items[0];
  const sideStories = items.slice(1, 5);
  const latest = items.slice(5, 15);

  const byCategory = (id) => items.filter((it) => it.category === id);

  return (
    <>
      <Header />
      <Ticker items={items} />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-lead">
              <div className="eyebrow">
                <span className="cat">{catLabel(lead.category, CATEGORIES)}</span>
                <IndicatorTag type={CATEGORIES.find((c) => c.id === lead.category)?.indicator} />
              </div>
              <h1>
                <a href={lead.link} target="_blank" rel="noopener noreferrer">
                  {lead.title}
                </a>
              </h1>
              <div className="hero-meta">
                <span>{lead.source}</span>
                <span>·</span>
                <span>{timeAgo(lead.date)}</span>
              </div>
              {usingFallback && (
                <p className="fallback-note">
                  Live feeds are unreachable right now — showing placeholder content. This
                  resolves automatically once deployed and feeds respond.
                </p>
              )}
            </div>

            <aside className="hero-side">
              <div className="hero-side-title">Also moving</div>
              {sideStories.map((it, i) => (
                <a key={i} className="side-item" href={it.link} target="_blank" rel="noopener noreferrer">
                  <h3>{it.title}</h3>
                  <div className="m">
                    {catLabel(it.category, CATEGORIES)} · {it.source} · {timeAgo(it.date)}
                  </div>
                </a>
              ))}
            </aside>
          </div>
        </section>

        {/* Latest */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>Latest</h2>
              <span className="count">{items.length} stories tracked</span>
            </div>
            <div className="latest">
              {latest.map((it, i) => (
                <a key={i} className="row" href={it.link} target="_blank" rel="noopener noreferrer">
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{it.title}</h3>
                    <div className="meta">
                      <span>{catLabel(it.category, CATEGORIES)}</span>
                      <span>·</span>
                      <span>{it.source}</span>
                      <span>·</span>
                      <span>{timeAgo(it.date)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Category sections */}
        {CATEGORIES.map((cat) => {
          const catItems = byCategory(cat.id).slice(0, 3);
          if (catItems.length === 0) return null;
          return (
            <section className="section" id={cat.id} key={cat.id}>
              <div className="wrap">
                <div className="section-head">
                  <div className="eyebrow">
                    <span className="cat">{cat.label}</span>
                    <IndicatorTag type={cat.indicator} />
                  </div>
                </div>
                <div className="cards">
                  {catItems.map((it, i) => (
                    <Card key={i} item={it} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
