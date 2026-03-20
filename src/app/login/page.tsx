"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMicrosoft, setLoadingMicrosoft] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const handleMicrosoft = async () => {
    setLoadingMicrosoft(true);
    await signIn("azure-ad", { callbackUrl: "/" });
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

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-cream mb-3">
            AI Mood Board
            <br />
            <span className="text-cream-muted">Generator</span>
          </h1>
          <p className="font-mono text-xs text-cream-muted/50 leading-relaxed">
            Sign in to generate creative packages
            <br />
            and save your projects.
          </p>
        </div>

        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loadingGoogle || loadingMicrosoft}
            className="flex w-full items-center gap-3 border border-dark-border bg-dark-surface px-5 py-3.5 transition-all hover:border-cream-muted/40 hover:bg-cream/[0.03] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingGoogle ? (
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border border-cream/30 border-t-cream" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span className="font-sans text-sm font-semibold text-cream">
              {loadingGoogle ? "Signing in…" : "Continue with Google"}
            </span>
          </button>

          {/* Microsoft */}
          <button
            onClick={handleMicrosoft}
            disabled={loadingGoogle || loadingMicrosoft}
            className="flex w-full items-center gap-3 border border-dark-border bg-dark-surface px-5 py-3.5 transition-all hover:border-cream-muted/40 hover:bg-cream/[0.03] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingMicrosoft ? (
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border border-cream/30 border-t-cream" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
                <path d="M11.5 2H2v9.5h9.5V2z" fill="#F25022" />
                <path d="M22 2h-9.5v9.5H22V2z" fill="#7FBA00" />
                <path d="M11.5 12.5H2V22h9.5v-9.5z" fill="#00A4EF" />
                <path d="M22 12.5h-9.5V22H22v-9.5z" fill="#FFB900" />
              </svg>
            )}
            <span className="font-sans text-sm font-semibold text-cream">
              {loadingMicrosoft ? "Signing in…" : "Continue with Microsoft"}
            </span>
          </button>
        </div>

        <p className="mt-8 text-center font-mono text-[10px] text-cream-muted/30 leading-relaxed">
          By signing in you agree to our terms of service.
          <br />
          Your data is never shared or sold.
        </p>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 font-mono text-[10px] text-cream-muted/20 tracking-widest uppercase">
        Powered by Antareslabs AI
      </p>
    </div>
  );
}
