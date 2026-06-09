import { getNews, CATEGORIES, INDICATOR_COLORS } from "../lib/feeds";
import { shortDate, fullDate } from "../lib/format";
import Header from "../components/Header";
import Ticker from "../components/Ticker";
import ArticleImage from "../components/ArticleImage";
import AdSlot from "../components/AdSlot";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

// Funnel links into the wider Cignal System. Swap SYSTEM_URL for the link-tree URL
// once it exists.
const ASSESSMENT_URL = "https://cignalscore.com";
const SYSTEM_URL = "https://multifamily.cignalsystem.com";

const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const indLabel = { leading: "Leading", lagging: "Lagging", coincident: "Coincident", policy: "Policy" };

function CalIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function TagIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v5l9 9 5-5-9-9H3z"/><circle cx="7" cy="11" r="1.4" fill="currentColor"/></svg>; }

function Card({ item }) {
  const c = catOf(item.category);
  return (
    <a className="card" href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="card-img"><ArticleImage title={item.title} color={c.color} label={c.label} />{item.official && <span className="badge">Primary source</span>}</div>
      <div className="kicker"><span className="cat">{c.label}</span><span className="sep">|</span><span className="date">{shortDate(item.date)}</span></div>
      <h3>{item.title}</h3>
      <div className="src">{item.source}</div>
    </a>
  );
}

function Rail() {
  return (
    <aside className="rail">
      <div className="rail-box">
        <div className="rb-eyebrow">Test your knowledge</div>
        <div className="rb-score">?</div>
        <h3>What&apos;s your Cignal Score?</h3>
        <p>A free 3-minute diagnostic on how well you read the market cycle.</p>
        <div className="rb-meta"><span>10 Questions</span><span>4 Categories</span><span>3 Min</span></div>
        <a className="rb-btn" href={ASSESSMENT_URL} target="_blank" rel="noopener noreferrer">Take the assessment</a>
      </div>
      <div className="rail-box">
        <div className="rb-eyebrow">Learn more</div>
        <h3>Go deeper with Cignal System</h3>
        <p>Market-cycle intelligence built for your industry — leading and trailing signals, forecasts, and dashboards.</p>
        <a className="rb-btn" href={SYSTEM_URL} target="_blank" rel="noopener noreferrer">Explore Cignal System</a>
        <a className="rb-btn ghost" href="#brief">Get the weekly brief</a>
      </div>
      <AdSlot format="rectangle" />
    </aside>
  );
}

export default async function Home() {
  const { items, usingFallback } = await getNews();
  const lead = items[0];
  const leadCat = catOf(lead.category);
  const highlight = items.slice(1, 5);
  const latFeature = items[5];
  const latGrid = items.slice(6, 9);
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
          <a href={lead.link} target="_blank" rel="noopener noreferrer"><div className="hero-img"><ArticleImage title={lead.title} color={leadCat.color} label={leadCat.label} /></div></a>
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

        <AdSlot format="leaderboard" />

        {/* MAIN + RIGHT RAIL */}
        <div className="main-grid">
          <div className="main-col">
            {latFeature && (
              <section className="panel">
                <div className="sec-head"><h2>Latest</h2><span className="ind" style={{ marginLeft: "auto" }}>{items.length} tracked</span></div>
                <a className="card feature" href={latFeature.link} target="_blank" rel="noopener noreferrer">
                  <div className="card-img"><ArticleImage title={latFeature.title} color={catOf(latFeature.category).color} label={catOf(latFeature.category).label} />{latFeature.official && <span className="badge">Primary source</span>}</div>
                  <div className="kicker"><span className="cat">{catOf(latFeature.category).label}</span><span className="sep">|</span><span className="date">{shortDate(latFeature.date)}</span></div>
                  <h3>{latFeature.title}</h3>
                  <div className="src">{latFeature.source}</div>
                </a>
                <div className="grid3" style={{ marginTop: 26 }}>{latGrid.map((it, i) => <Card key={i} item={it} />)}</div>
              </section>
            )}

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

          <Rail />
        </div>
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

      <div className="wrap"><AdSlot format="leaderboard" /></div>

      <Newsletter variant="media" />
      <Footer />
    </>
  );
}
