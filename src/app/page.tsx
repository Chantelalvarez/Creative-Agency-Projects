"use client";

import { useState } from "react";
import Header from "@/components/Header";
import BriefInput from "@/components/BriefInput";
import StructuredBriefForm from "@/components/StructuredBriefForm";
import TranscriptInput from "@/components/TranscriptInput";
import VoiceDictation from "@/components/VoiceDictation";
import ColorPalette from "@/components/ColorPalette";
import MoodKeywords from "@/components/MoodKeywords";
import TypographyDirection from "@/components/TypographyDirection";
import ImageGrid from "@/components/ImageGrid";
import CreativeDirections from "@/components/CreativeDirections";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { MoodBoard } from "@/lib/types";

type InputMode = "write" | "structured" | "transcript" | "dictate";

const INPUT_MODES: { id: InputMode; label: string; description: string }[] = [
  {
    id: "write",
    label: "Write a Brief",
    description: "Type or upload a creative brief",
  },
  {
    id: "structured",
    label: "Create a Brief",
    description: "Guided step-by-step form",
  },
  {
    id: "transcript",
    label: "Use a Transcript",
    description: "Extract from meeting notes",
  },
  {
    id: "dictate",
    label: "Dictate Notes",
    description: "Record spoken input",
  },
];

export default function Home() {
  const [moodBoard, setMoodBoard] = useState<MoodBoard | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("write");

  const handleGenerate = async (brief: string) => {
    setIsGenerating(true);
    setIsLoadingImages(false);
    setError(null);
    setMoodBoard(null);

    try {
      // Step 1: Generate mood board data from Claude
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json();
        throw new Error(errorData.error || "Failed to generate mood board.");
      }

      const data = await generateRes.json();

      // Show the text data immediately
      setMoodBoard({ brief, data, images: [] });
      setIsGenerating(false);
      setIsLoadingImages(true);

      // Step 2: Fetch images from Unsplash
      const imagesRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerms: data.visualSearchTerms }),
      });

      if (imagesRes.ok) {
        const { images } = await imagesRes.json();
        setMoodBoard((prev) => (prev ? { ...prev, images } : null));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setIsGenerating(false);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleTranscriptBrief = (brief: string) => {
    handleGenerate(brief);
  };

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-6 pt-28 pb-20">
        {/* Hero / Input Section */}
        <div className="mb-20 max-w-2xl">
          <h1 className="mb-3 font-sans text-4xl font-bold tracking-tight text-cream sm:text-5xl">
            Mood Board
            <br />
            <span className="text-cream-muted">Generator</span>
          </h1>
          <p className="mb-10 font-mono text-sm text-cream-muted/70 leading-relaxed max-w-md">
            Input your creative brief and let AI generate a comprehensive visual
            direction — colours, typography, imagery, and creative strategy.
          </p>

          {/* Mode Selector */}
          <div className="mb-8">
            <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-3">
              Choose your input method
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INPUT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setInputMode(mode.id)}
                  disabled={isGenerating}
                  className={`group border px-3 py-3 text-left transition-all disabled:opacity-50 ${
                    inputMode === mode.id
                      ? "border-cream bg-cream/5"
                      : "border-dark-border hover:border-cream-muted/40"
                  }`}
                >
                  <span
                    className={`block font-sans text-xs font-semibold ${
                      inputMode === mode.id
                        ? "text-cream"
                        : "text-cream-muted/70 group-hover:text-cream"
                    }`}
                  >
                    {mode.label}
                  </span>
                  <span className="block font-mono text-[10px] text-cream-muted/40 mt-0.5">
                    {mode.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Components */}
          {inputMode === "write" && (
            <BriefInput onGenerate={handleGenerate} isLoading={isGenerating} />
          )}
          {inputMode === "structured" && (
            <StructuredBriefForm
              onComplete={handleGenerate}
              isLoading={isGenerating}
            />
          )}
          {inputMode === "transcript" && (
            <TranscriptInput
              onBriefExtracted={handleTranscriptBrief}
              isLoading={isGenerating}
            />
          )}
          {inputMode === "dictate" && (
            <VoiceDictation
              onBriefExtracted={handleTranscriptBrief}
              isLoading={isGenerating}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-12 border border-red-500/30 bg-red-500/5 p-4">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && <LoadingSkeleton />}

        {/* Mood Board Results */}
        {moodBoard && !isGenerating && (
          <div className="space-y-16">
            {/* Brief recap */}
            <div className="border-l-2 border-cream-muted/20 pl-6">
              <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-2">
                Brief
              </p>
              <p className="font-mono text-sm text-cream/60 leading-relaxed max-w-xl">
                {moodBoard.brief}
              </p>
            </div>

            <div className="h-px bg-dark-border" />

            <ColorPalette colors={moodBoard.data.colorPalette} />

            <div className="h-px bg-dark-border" />

            <MoodKeywords keywords={moodBoard.data.moodKeywords} />

            <div className="h-px bg-dark-border" />

            <TypographyDirection
              direction={moodBoard.data.typographyDirection}
            />

            <div className="h-px bg-dark-border" />

            <ImageGrid
              images={moodBoard.images}
              isLoading={isLoadingImages}
            />

            <div className="h-px bg-dark-border" />

            <CreativeDirections
              directions={moodBoard.data.creativeDirections}
            />

            {/* Footer attribution */}
            <div className="border-t border-dark-border pt-8 text-center">
              <p className="font-mono text-[10px] text-cream-muted/30 tracking-widest uppercase">
                Generated by Antareslabs AI Mood Board Generator
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
