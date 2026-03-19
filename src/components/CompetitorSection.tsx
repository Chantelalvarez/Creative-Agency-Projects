import { CompetitorAnalysis, CompetitorBrand } from "@/lib/types";

const PRICE_COLOURS: Record<string, string> = {
  budget: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  mid: "text-green-400 border-green-400/30 bg-green-400/5",
  premium: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  luxury: "text-purple-400 border-purple-400/30 bg-purple-400/5",
};

function CompetitorCard({ brand }: { brand: CompetitorBrand }) {
  const priceKey = brand.pricePositioning?.toLowerCase().trim() ?? "";
  const priceClass = PRICE_COLOURS[priceKey] ?? "text-cream-muted/60 border-dark-border bg-dark-surface";

  return (
    <div className="border border-dark-border bg-dark-surface p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-sans text-base font-bold text-cream">{brand.name}</h3>
        {brand.pricePositioning && (
          <span
            className={`shrink-0 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${priceClass}`}
          >
            {brand.pricePositioning}
          </span>
        )}
      </div>

      {/* Overview */}
      {brand.overview && (
        <p className="font-mono text-sm text-cream/70 leading-relaxed">
          {brand.overview}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Visual style */}
        {brand.visualStyle && (
          <div>
            <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-1">
              Visual Style
            </p>
            <p className="font-mono text-xs text-cream/70 leading-relaxed">
              {brand.visualStyle}
            </p>
          </div>
        )}

        {/* Audience */}
        {brand.targetAudience && (
          <div>
            <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-1">
              Target Audience
            </p>
            <p className="font-mono text-xs text-cream/70 leading-relaxed">
              {brand.targetAudience}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 border-t border-dark-border pt-4">
        {/* Strengths */}
        {brand.strengths && (
          <div>
            <p className="font-mono text-[10px] text-green-400/70 uppercase tracking-widest mb-1">
              Strengths
            </p>
            <p className="font-mono text-xs text-cream/60 leading-relaxed">
              {brand.strengths}
            </p>
          </div>
        )}

        {/* Weaknesses */}
        {brand.weaknesses && (
          <div>
            <p className="font-mono text-[10px] text-red-400/70 uppercase tracking-widest mb-1">
              Weaknesses
            </p>
            <p className="font-mono text-xs text-cream/60 leading-relaxed">
              {brand.weaknesses}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CompetitorSectionProps {
  analysis: CompetitorAnalysis | null;
  isLoading: boolean;
  error?: string | null;
}

export default function CompetitorSection({
  analysis,
  isLoading,
  error,
}: CompetitorSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-56 animate-shimmer" />
        ))}
        <div className="h-24 animate-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500/20 bg-red-500/5 p-4">
        <p className="font-mono text-xs text-red-400">{error}</p>
      </div>
    );
  }

  if (!analysis || analysis.competitors.length === 0) {
    return (
      <p className="font-mono text-sm text-cream-muted/50">
        No competitor brands were identified in the brief.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {analysis.competitors.map((brand) => (
          <CompetitorCard key={brand.name} brand={brand} />
        ))}
      </div>

      {/* Market opportunity */}
      {analysis.marketOpportunity && (
        <div className="border-l-2 border-cream/20 pl-6 py-2">
          <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-3">
            Market Opportunity
          </p>
          <p className="font-mono text-sm text-cream/90 leading-relaxed max-w-3xl">
            {analysis.marketOpportunity}
          </p>
        </div>
      )}
    </div>
  );
}
