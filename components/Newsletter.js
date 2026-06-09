"use client";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  function submit() {
    if (!email || !email.includes("@")) return;
    setDone(true);
  }
  return (
    <section id="brief"><div className="wrap"><div className="cta">
      <div>
        <h2>Read the cycle, not the noise.</h2>
        <p>A weekly brief that sorts the week&apos;s US economic releases into leading, coincident, and lagging signals — so you can see where the market actually is.</p>
      </div>
      <div>
        {done ? (
          <p className="ndone">You&apos;re on the list. First brief lands next Monday.</p>
        ) : (
          <>
            <div className="nform">
              <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
              <button onClick={submit}>Get the brief</button>
            </div>
            <p className="nnote">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div></div></section>
  );
}
