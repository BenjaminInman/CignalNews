import "./globals.css";
import MacroTicker from "../components/MacroTicker";
import SocialBar from "../components/SocialBar";

export const metadata = {
  title: "Cignal News — US economic signal",
  description:
    "Cignal News: the latest US economic headlines from primary sources and major publishers, organized by where each theme sits in the market cycle. Part of the Cignal System.",
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
      </head>
      <body>
        <MacroTicker />
        <SocialBar />
        {children}
      </body>
    </html>
  );
}
