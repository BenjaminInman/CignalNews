"use client";
import { useState } from "react";
import BriefCover from "./BriefCover";

export default function Newsletter({ variant = "media" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  function submit() {
    if (!email || !email.includes("@")) return;
    setDone(true);
  }
  const form = done ? (
    <p className="ndone">You&apos;re on the list. First brief lands next Monday.</p>
  ) : (
    <>
      <div className="nform">
        <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
        <button onClick={submit}>{variant === "box" ? "Subscribe" : "Get the brief"}</button>
      </div>
      {variant === "media" && <p className="nnote">No spam. Unsubscribe anytime.</p>}
    </>
  );

  if (variant === "box") {
    return (
      <div className="brief-box">
        <h3>Never miss a signal</h3>
        <p>The week&apos;s US economic releases, sorted into leading, coincident, and lagging signals.</p>
        {form}
      </div>
    );
  }

  return (
    <section className="band" id="brief"><div className="wrap"><div className="media-card">
      <div className="media-cover"><BriefCover /></div>
      <div>
        <div className="eyebrow">The weekly brief</div>
        <h2>Read the cycle, not the noise.</h2>
        <p>A weekly brief that sorts the week&apos;s US economic releases into leading, coincident, and lagging signals — so you can see where the market actually is.</p>
        {form}
      </div>
    </div></div></section>
  );
}
