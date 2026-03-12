"use client";

import { useState, useRef } from "react";

interface TranscriptInputProps {
  onBriefExtracted: (brief: string) => void;
  isLoading: boolean;
}

export default function TranscriptInput({
  onBriefExtracted,
  isLoading,
}: TranscriptInputProps) {
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [".txt", ".md", ".vtt", ".srt"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError("Unsupported file type. Please upload a .txt, .md, .vtt, or .srt file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      setTranscript(text.slice(0, 10000));
      setFileName(file.name);
      setError(null);
    } catch {
      setError("Failed to read file.");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/extract-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: transcript.trim(), inputType: "transcript" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to extract brief.");
      }

      const { brief } = await res.json();
      onBriefExtracted(brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setTranscript("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const disabled = isLoading || isExtracting;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="block font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
          Meeting Transcript
        </label>
        <div className="flex items-center gap-3">
          {fileName && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-cream-muted/60 max-w-[140px] truncate">
                {fileName}
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="text-cream-muted/40 hover:text-cream transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 border border-dark-border px-3 py-1.5 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest transition-all hover:border-cream-muted hover:text-cream-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V10M7 1L4 4M7 1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 10V12C1 12.5523 1.44772 13 2 13H12C12.5523 13 13 12.5523 13 12V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload Transcript
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.vtt,.srt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <textarea
        value={transcript}
        onChange={(e) => {
          setTranscript(e.target.value);
          if (fileName) setFileName(null);
        }}
        placeholder="Paste your meeting transcript, Fireflies notes, or any meeting notes here..."
        rows={6}
        maxLength={10000}
        className="w-full resize-none rounded-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/40 focus:border-cream-muted focus:outline-none transition-colors"
        disabled={disabled}
      />

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-cream-muted/50">
          {transcript.length}/10000
        </span>
        <button
          type="button"
          onClick={handleExtract}
          disabled={!transcript.trim() || disabled}
          className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
        >
          {isExtracting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Extracting Brief
            </span>
          ) : (
            "Extract & Generate"
          )}
        </button>
      </div>

      <p className="font-mono text-[10px] text-cream-muted/30 leading-relaxed">
        AI will extract key project details from your transcript and generate a mood board from them.
        Supports Fireflies.ai exports, Otter.ai transcripts, or any meeting notes.
      </p>
    </div>
  );
}
