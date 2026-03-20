"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cream" />
          <span className="font-sans text-sm font-bold tracking-[0.3em] text-cream uppercase">
            Antareslabs
          </span>
        </Link>

        {/* Center: App name */}
        <span className="font-mono text-xs text-cream-muted tracking-wider hidden sm:block">
          AI Mood Board Generator
        </span>

        {/* Right: nav + user */}
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <Link
                href="/projects"
                className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest hover:text-cream transition-colors hidden sm:block"
              >
                My Projects
              </Link>

              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 group"
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      className="h-7 w-7 rounded-full object-cover border border-dark-border group-hover:border-cream-muted/40 transition-colors"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center group-hover:border-cream-muted/40 transition-colors">
                      <span className="font-sans text-[10px] font-bold text-cream">
                        {session.user.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                  )}
                  <span className="font-mono text-[10px] text-cream-muted/60 hidden sm:block max-w-[120px] truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className={`text-cream-muted/40 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M2 4L5 7L8 4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 z-50 w-48 border border-dark-border bg-dark-surface shadow-xl">
                      <div className="border-b border-dark-border px-4 py-3">
                        <p className="font-sans text-xs font-semibold text-cream truncate">
                          {session.user.name}
                        </p>
                        <p className="font-mono text-[10px] text-cream-muted/50 truncate mt-0.5">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href="/projects"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest hover:text-cream hover:bg-cream/[0.03] transition-colors sm:hidden"
                      >
                        My Projects
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2 px-4 py-3 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest hover:text-cream hover:bg-cream/[0.03] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M8 2H10C10.5523 2 11 2.44772 11 3V9C11 9.55228 10.5523 10 10 10H8M5 8.5L8 6L5 3.5M1 6H8"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
