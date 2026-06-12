// Custom vector cover for the Weekly Brief media card. Rendered inline so it uses
// the site's own fonts (Archivo / IBM Plex Mono) and brand colors, and stays crisp
// at any size. Edit text/values here if the brief's framing changes.
export default function BriefCover() {
  return (
    <svg viewBox="0 0 600 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cignal News — The Weekly Brief">
      <defs>
        <linearGradient id="bcbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141417" />
          <stop offset="1" stopColor="#0a0a0b" />
        </linearGradient>
        <radialGradient id="bcglow" cx="0.85" cy="0.08" r="0.55">
          <stop offset="0" stopColor="#f23a28" stopOpacity="0.22" />
          <stop offset="1" stopColor="#f23a28" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bcarea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f23a28" stopOpacity="0.30" />
          <stop offset="1" stopColor="#f23a28" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="600" height="800" fill="url(#bcbg)" />
      <rect width="600" height="800" fill="url(#bcglow)" />

      {/* wordmark */}
      <text x="46" y="74" fontFamily="Archivo, Arial, sans-serif" fontWeight="800" fontSize="24" letterSpacing="-0.5" fill="#ffffff">CIGNAL<tspan fill="#f23a28"> · </tspan>NEWS</text>
      <text x="554" y="74" textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize="13" letterSpacing="2" fill="#8c919b">WEEKLY</text>
      <line x1="46" y1="96" x2="554" y2="96" stroke="#26272b" strokeWidth="1" />

      {/* eyebrow */}
      <text x="46" y="156" fontFamily="'IBM Plex Mono', monospace" fontSize="13" letterSpacing="3" fill="#f23a28">THE BRIEF — EVERY MONDAY</text>

      {/* title */}
      <text x="44" y="252" fontFamily="Archivo, Arial, sans-serif" fontWeight="900" fontSize="76" letterSpacing="-2" fill="#ffffff">THE</text>
      <text x="44" y="328" fontFamily="Archivo, Arial, sans-serif" fontWeight="900" fontSize="76" letterSpacing="-2" fill="#ffffff">WEEKLY</text>
      <text x="44" y="404" fontFamily="Archivo, Arial, sans-serif" fontWeight="900" fontSize="76" letterSpacing="-2" fill="#ffffff">BRIEF<tspan fill="#f23a28">.</tspan></text>

      {/* signal chart motif */}
      <path d="M46 580 L120 552 L190 568 L260 506 L330 528 L400 470 L470 492 L554 430 L554 600 L46 600 Z" fill="url(#bcarea)" />
      <polyline points="46,580 120,552 190,568 260,506 330,528 400,470 470,492 554,430" fill="none" stroke="#f23a28" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="260" cy="506" r="5" fill="#0c0c0e" stroke="#f23a28" strokeWidth="3" />
      <circle cx="400" cy="470" r="5" fill="#0c0c0e" stroke="#f23a28" strokeWidth="3" />
      <circle cx="554" cy="430" r="6" fill="#f23a28" />

      {/* indicator language */}
      <g fontFamily="'IBM Plex Mono', monospace" fontSize="13" letterSpacing="1">
        <circle cx="52" cy="652" r="5" fill="#16a35a" /><text x="64" y="657" fill="#cfd1d5">LEADING</text>
        <circle cx="200" cy="652" r="5" fill="#d2920c" /><text x="212" y="657" fill="#cfd1d5">COINCIDENT</text>
        <circle cx="392" cy="652" r="5" fill="#64748b" /><text x="404" y="657" fill="#cfd1d5">LAGGING</text>
      </g>

      <line x1="46" y1="690" x2="554" y2="690" stroke="#26272b" strokeWidth="1" />

      {/* macro strip echo */}
      <text x="46" y="724" fontFamily="'IBM Plex Mono', monospace" fontSize="14" fill="#e9eaec">10Y 4.41% <tspan fill="#e0392b">▾</tspan>  /  CPI 2.9% <tspan fill="#e0392b">▾</tspan>  /  S&amp;P +0.6% <tspan fill="#16a35a">▴</tspan></text>

      {/* tagline */}
      <text x="46" y="770" fontFamily="'IBM Plex Mono', monospace" fontSize="14" letterSpacing="0.5" fill="#9aa0aa">Read the cycle, not the noise.</text>
      <rect x="46" y="786" width="62" height="4" fill="#f23a28" />
    </svg>
  );
}
