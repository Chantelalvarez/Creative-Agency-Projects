"use client";

import { useState } from "react";

interface BriefInputProps {
  onGenerate: (brief: string) => void;
  isLoading: boolean;
}

export default function BriefInput({ onGenerate, isLoading }: BriefInputProps) {
  const [brief, setBrief] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brief.trim() && !isLoading) {
      onGenerate(brief.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        <label
          htmlFor="brief"
          className="block font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase"
        >
          Creative Brief
        </label>

        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe your project, brand, or creative vision..."
          maxLength={2000}
          rows={4}
          className="w-full resize-none rounded-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/40 focus:border-cream-muted focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-cream-muted/50">
            {brief.length}/2000
          </span>
          <button
            type="submit"
            disabled={!brief.trim() || isLoading}
            className="group relative border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Generating
              </span>
            ) : (
              "Generate Board"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
