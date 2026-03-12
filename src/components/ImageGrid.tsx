"use client";

import { UnsplashImage } from "@/lib/types";

interface ImageGridProps {
  images: UnsplashImage[];
  isLoading: boolean;
}

export default function ImageGrid({ images, isLoading }: ImageGridProps) {
  if (isLoading) {
    return (
      <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
          Visual References
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-shimmer"
            />
          ))}
        </div>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
      <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        Visual References
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <div
            key={image.id}
            className="group relative overflow-hidden animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-dark/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <div className="p-3">
                <a
                  href={image.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-cream/80 hover:text-cream transition-colors"
                >
                  {image.photographer}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] text-cream-muted/40 tracking-wider">
        Images via Unsplash. Click to view photographer.
      </p>
    </section>
  );
}
