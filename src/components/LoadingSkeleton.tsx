export default function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {/* Color palette skeleton */}
      <div>
        <div className="mb-6 h-3 w-32 animate-shimmer" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square w-full animate-shimmer" />
              <div className="mt-2 h-2 w-12 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Keywords skeleton */}
      <div>
        <div className="mb-6 h-3 w-28 animate-shimmer" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-shimmer" />
          ))}
        </div>
      </div>

      {/* Typography skeleton */}
      <div>
        <div className="mb-6 h-3 w-40 animate-shimmer" />
        <div className="h-40 animate-shimmer" />
      </div>

      {/* Images skeleton */}
      <div>
        <div className="mb-6 h-3 w-36 animate-shimmer" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-shimmer" />
          ))}
        </div>
      </div>

      {/* Directions skeleton */}
      <div>
        <div className="mb-6 h-3 w-36 animate-shimmer" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
