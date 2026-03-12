export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cream" />
          <span className="font-sans text-sm font-bold tracking-[0.3em] text-cream uppercase">
            Antareslabs
          </span>
        </div>
        <span className="font-mono text-xs text-cream-muted tracking-wider">
          AI Mood Board Generator
        </span>
      </div>
    </header>
  );
}
