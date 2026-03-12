"use client";

import { useState } from "react";
import { Color } from "@/lib/types";

interface ColorPaletteProps {
  colors: Color[];
}

export default function ColorPalette({ colors }: ColorPaletteProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyHex = async (hex: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <h2 className="mb-6 font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        Colour Palette
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => copyHex(color.hex, i)}
            className="group cursor-pointer"
          >
            <div
              className="aspect-square w-full border border-dark-border transition-transform group-hover:scale-105"
              style={{ backgroundColor: color.hex }}
            />
            <div className="mt-2 space-y-0.5">
              <p className="font-mono text-[10px] text-cream-muted uppercase tracking-wider">
                {copiedIndex === i ? "Copied" : color.hex}
              </p>
              <p className="font-mono text-[10px] text-cream-muted/60 truncate">
                {color.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
