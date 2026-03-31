"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "error">("verifying");

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email");

    if (!token || !email) {
      setStatus("error");
      return;
    }

    signIn("credentials", { email, token, redirect: false }).then((res) => {
      if (res?.ok) {
        router.replace("/");
      } else {
        setStatus("error");
      }
    });
  }, [params, router]);

  return (
    <>
      {status === "verifying" ? (
        <div className="text-center">
          <span className="block mx-auto mb-6 h-6 w-6 animate-spin rounded-full border border-cream/30 border-t-cream" />
          <p className="font-mono text-xs text-cream-muted/50 tracking-widest uppercase">
            Verifying your link…
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="font-sans text-sm text-cream mb-2">Link invalid or expired</p>
          <p className="font-mono text-xs text-cream-muted/40 mb-8">
            Magic links expire after 15 minutes and can only be used once.
          </p>
          <a
            href="/login"
            className="font-mono text-xs text-cream-muted/60 underline underline-offset-4 hover:text-cream transition-colors"
          >
            Request a new link
          </a>
        </div>
      )}
    </>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-3 mb-16">
        <div className="h-2 w-2 rounded-full bg-cream" />
        <span className="font-sans text-sm font-bold tracking-[0.3em] text-cream uppercase">
          Antareslabs
        </span>
      </div>
      <Suspense fallback={
        <div className="text-center">
          <span className="block mx-auto mb-6 h-6 w-6 animate-spin rounded-full border border-cream/30 border-t-cream" />
          <p className="font-mono text-xs text-cream-muted/50 tracking-widest uppercase">
            Loading…
          </p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
