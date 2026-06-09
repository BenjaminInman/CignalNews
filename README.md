# Cignal

A clean, signal-driven feed of the latest **US economic news**, aggregated from
primary sources (the Federal Reserve) and major publishers (via Google News),
organized by where each theme sits in the **market cycle** — leading, coincident,
and lagging indicators.

Built with Next.js (App Router). Deploys to Vercel with zero config.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy

Push to GitHub, then import the repo in Vercel and click Deploy. Every push to
`main` redeploys automatically. No environment variables are required for the
current feeds.

## How it works

- `lib/feeds.js` — all feed sources and the aggregation logic. Edit the `FEEDS`
  array to add/remove sources, and `CATEGORIES` to change sections or their
  indicator type.
- Headlines link out to their original publisher; the app never stores article
  text — only the headline, source, and link. This is the correct, copyright-safe
  way to run an aggregator.
- The page renders at request time and caches each feed for ~10 minutes.

## Adding more sources

Government feeds you can drop into `FEEDS` (all public domain):

- Federal Reserve press releases: `https://www.federalreserve.gov/feeds/press_all.xml` (already wired)
- Bureau of Economic Analysis (GDP, PCE): `https://apps.bea.gov/rss/rss.xml`
- Bureau of Labor Statistics releases — see `https://www.bls.gov/feed/`

The Google News query helper (`gnews(...)`) lets you add any topic as a feed,
e.g. `gnews("commercial real estate cap rates")`.

## Next steps (roadmap)

- **FRED indicator ticker** — swap the headline ticker for live values (housing
  starts, rental vacancy, mortgage rates, CPI shelter) using the free FRED API.
  Requires a FRED API key stored as a Vercel environment variable.
- **International** — add per-country feeds (central banks / statistics offices)
  once US coverage is solid.
- **Newsletter** — wire `components/Newsletter.js` to your email provider.
