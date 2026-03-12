interface MoodKeywordsProps {
  keywords: string[];
}

export default function MoodKeywords({ keywords }: MoodKeywordsProps) {
  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        Mood Keywords
      </h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, i) => (
          <span
            key={i}
            className="border border-dark-border px-4 py-2 font-mono text-xs text-cream tracking-wider"
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}
