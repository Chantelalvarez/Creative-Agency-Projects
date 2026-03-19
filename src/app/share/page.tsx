import { Suspense } from "react";
import ShareContent from "./ShareContent";
import Header from "@/components/Header";

export default function SharePage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 pt-40 pb-20">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border border-cream border-t-transparent" />
              <span className="font-mono text-sm text-cream-muted/60">
                Loading creative package...
              </span>
            </div>
          </div>
        }
      >
        <ShareContent />
      </Suspense>
    </>
  );
}
