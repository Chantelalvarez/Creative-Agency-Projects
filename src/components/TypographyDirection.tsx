interface TypographyDirectionProps {
  direction: {
    headingStyle: string;
    bodyStyle: string;
    notes: string;
  };
}

export default function TypographyDirection({
  direction,
}: TypographyDirectionProps) {
  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        Typography Direction
      </h2>
      <div className="space-y-4 border border-dark-border bg-dark-surface p-6">
        <div>
          <p className="mb-1 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest">
            Headings
          </p>
          <p className="font-sans text-lg font-semibold text-cream">
            {direction.headingStyle}
          </p>
        </div>
        <div className="border-t border-dark-border pt-4">
          <p className="mb-1 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest">
            Body
          </p>
          <p className="font-mono text-sm text-cream/80">
            {direction.bodyStyle}
          </p>
        </div>
        {direction.notes && (
          <div className="border-t border-dark-border pt-4">
            <p className="mb-1 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest">
              Notes
            </p>
            <p className="font-mono text-xs text-cream-muted">
              {direction.notes}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
