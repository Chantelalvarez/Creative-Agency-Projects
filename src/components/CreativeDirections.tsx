interface CreativeDirectionsProps {
  directions: string[];
}

export default function CreativeDirections({
  directions,
}: CreativeDirectionsProps) {
  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
      <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        Creative Directions
      </h2>
      <div className="space-y-3">
        {directions.map((direction, i) => (
          <div
            key={i}
            className="flex gap-4 border border-dark-border bg-dark-surface p-5"
          >
            <span className="font-mono text-xs text-cream-muted/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="font-mono text-sm text-cream/90 leading-relaxed">
              {direction}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
