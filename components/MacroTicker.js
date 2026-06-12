import { MACRO } from "../lib/macro";

export default function MacroTicker() {
  const loop = [...MACRO, ...MACRO];
  return (
    <div className="macro" aria-label="Live US macro snapshot">
      <div className="macro-tab"><span className="pulse" /> Live</div>
      <div className="macro-wrap">
        <div className="macro-track">
          {loop.map((m, i) => (
            <span className="macro-item" key={i}>
              <span className="ml">{m.label}</span>
              <span className="mv">{m.value}</span>
              <span className={`md ${m.dir}`}>{m.delta}</span>
              <span className="mslash">/</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
