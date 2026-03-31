"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-16">
        <div className="h-2 w-2 rounded-full bg-cream" />
        <span className="font-sans text-sm font-bold tracking-[0.3em] text-cream uppercase">
          Antareslabs
        </span>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-cream mb-3">
            AI Mood Board
            <br />
            <span className="text-cream-muted">Generator</span>
          </h1>
          <p className="font-mono text-xs text-cream-muted/50 leading-relaxed">
            {sent
              ? "Check your inbox for your sign-in link."
              : "Enter your email to receive a sign-in link."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-dark-border bg-dark-surface px-5 py-3.5 font-mono text-sm text-cream placeholder-cream-muted/30 outline-none focus:border-cream-muted/40 transition-colors"
            />
            {error && (
              <p className="font-mono text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 border border-dark-border bg-dark-surface px-5 py-3.5 transition-all hover:border-cream-muted/40 hover:bg-cream/[0.03] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border border-cream/30 border-t-cream" />
              ) : (
                <span className="font-sans text-sm font-semibold text-cream">
                  Send sign-in link
                </span>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-dark-border">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream-muted">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <p className="font-mono text-xs text-cream-muted/50 leading-relaxed mb-6">
              Link sent to <span className="text-cream">{email}</span>
              <br />
              It expires in 15 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="font-mono text-xs text-cream-muted/40 underline underline-offset-4 hover:text-cream-muted transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="mt-8 text-center font-mono text-[10px] text-cream-muted/30 leading-relaxed">
          By signing in you agree to our terms of service.
          <br />
          Your data is never shared or sold.
        </p>
      </div>

      <p className="absolute bottom-8 font-mono text-[10px] text-cream-muted/20 tracking-widest uppercase">
        Powered by Antareslabs AI
      </p>
    </div>
  );
}
