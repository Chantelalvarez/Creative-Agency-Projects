"use client";

import { useSearchParams } from "next/navigation";
import LZString from "lz-string";
import { CreativeDocument } from "@/lib/types";
import BriefDisplay from "@/components/BriefDisplay";
import CompetitorSection from "@/components/CompetitorSection";
import ColorPalette from "@/components/ColorPalette";
import MoodKeywords from "@/components/MoodKeywords";
import TypographyDirection from "@/components/TypographyDirection";
import ImageGrid from "@/components/ImageGrid";
import CreativeDirections from "@/components/CreativeDirections";
import { useState } from "react";

function SectionLabel({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-mono text-[10px] text-cream-muted/30 uppercase tracking-widest">
        {number}
      </span>
      <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
        {title}
      </h2>
      <div className="flex-1 h-px bg-dark-border" />
    </div>
  );
}

export default function ShareContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get("d");
  const [activeRoute, setActiveRoute] = useState(0);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-40 pb-20">
        <p className="font-mono text-sm text-red-400">
          Invalid share link. The data may have been corrupted or the link is
          incomplete.
        </p>
      </div>
    );
  }

  let doc: CreativeDocument;
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(data);
    if (!decompressed) throw new Error("Decompression failed");
    doc = JSON.parse(decompressed);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-40 pb-20">
        <p className="font-mono text-sm text-red-400">
          Could not decode share link. Please request a new link from the
          sender.
        </p>
      </div>
    );
  }

  const { brief, competitorAnalysis, routes, routeImages } = doc;
  const activeRouteData = routes?.[activeRoute];
  const projectName =
    brief?.projectName || brief?.brandName || "Creative Package";

  return (
    <main className="mx-auto max-w-7xl px-6 pt-24 pb-20">
      {/* Read-only banner */}
      <div className="mb-8 border border-dark-border bg-dark-surface px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest">
            Shared Creative Package — Read Only
          </p>
          <p className="font-sans text-sm font-semibold text-cream mt-0.5">
            {projectName}
          </p>
        </div>
        {doc.generatedAt && (
          <p className="font-mono text-[10px] text-cream-muted/30">
            Generated{" "}
            {new Date(doc.generatedAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="space-y-20">
        {/* Section 1 — Brief */}
        <section id="section-brief">
          <SectionLabel number="01" title="Project Brief" />
          <BriefDisplay brief={brief} />
        </section>

        <div className="h-px bg-dark-border" />

        {/* Section 2 — Competitors */}
        <section id="section-competitors">
          <SectionLabel number="02" title="Competitor Research" />
          <CompetitorSection
            analysis={competitorAnalysis}
            isLoading={false}
          />
        </section>

        <div className="h-px bg-dark-border" />

        {/* Section 3 — Creative Directions */}
        <section id="section-routes">
          <SectionLabel number="03" title="Creative Directions" />

          {routes?.length > 0 && (
            <>
              <div className="flex gap-0 border-b border-dark-border mb-10">
                {routes.map((route, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveRoute(i)}
                    className={`px-8 py-3.5 font-mono text-xs tracking-widest uppercase transition-all border-b-2 -mb-px ${
                      activeRoute === i
                        ? "border-cream text-cream"
                        : "border-transparent text-cream-muted/40 hover:text-cream-muted"
                    }`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>

              {activeRouteData && (
                <div className="space-y-16 animate-fade-in" key={activeRoute}>
                  <div className="border-l-2 border-cream/20 pl-6 max-w-2xl">
                    <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-3">
                      Creative Direction
                    </p>
                    <p className="font-sans text-xl text-cream leading-relaxed">
                      {activeRouteData.direction}
                    </p>
                  </div>
                  <div className="h-px bg-dark-border" />
                  <ColorPalette colors={activeRouteData.colorPalette} />
                  <div className="h-px bg-dark-border" />
                  <MoodKeywords keywords={activeRouteData.moodKeywords} />
                  <div className="h-px bg-dark-border" />
                  <TypographyDirection
                    direction={activeRouteData.typographyDirection}
                  />
                  <div className="h-px bg-dark-border" />
                  <ImageGrid
                    images={routeImages?.[activeRoute] ?? []}
                    isLoading={false}
                  />
                  <div className="h-px bg-dark-border" />
                  <CreativeDirections
                    directions={activeRouteData.creativeDirections}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <div className="border-t border-dark-border pt-8 text-center">
          <p className="font-mono text-[10px] text-cream-muted/30 tracking-widest uppercase">
            Generated by Antareslabs AI Creative Package Generator
          </p>
        </div>
      </div>
    </main>
  );
}
