import "./globals.css";
import MacroTicker from "../components/MacroTicker";
import SocialBar from "../components/SocialBar";

import { SITE } from "../lib/site";

const DESC =
  "Cignal News: the latest US economic headlines from primary sources and major publishers, organized by where each theme sits in the market cycle. A member of the Cignal System.";

// metadataBase makes every page self-canonicalise to cignalnews.com regardless
// of which hostname served it. Without it, the .vercel.app URLs and the custom
// domain compete as duplicate copies of the same site.
export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Cignal News — US economic signal",
    template: "%s — Cignal News",
  },
  description: DESC,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: "Cignal News — US economic signal",
    description: DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cignal News — US economic signal",
    description: DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      parentOrganization: { "@type": "Organization", name: "Cignal System", url: SITE.systemUrl },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
        />
      </head>
      <body>
        <MacroTicker />
        <SocialBar />
        {children}
      </body>
    </html>
  );
}
