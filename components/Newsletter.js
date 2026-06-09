"use client";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!email || !email.includes("@")) return;
    // Wire this to your email provider (Mailchimp, ConvertKit, Resend, etc.).
    // For now it confirms locally so the flow is testable.
    setDone(true);
  }

  return (
    <section className="signal-cta" id="brief">
      <div className="wrap">
        <div>
          <h2>Read the cycle, not the noise.</h2>
          <p>
            A weekly brief that sorts the week&apos;s US economic releases into leading,
            coincident, and lagging signals — so you can see where the market actually is.
          </p>
        </div>
        <div>
          {done ? (
            <p style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: 14 }}>
              You&apos;re on the list. First brief lands next Monday.
            </p>
          ) : (
            <>
              <div className="nform">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button onClick={submit}>Get the brief</button>
              </div>
              <p className="nnote">No spam. Unsubscribe anytime.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
