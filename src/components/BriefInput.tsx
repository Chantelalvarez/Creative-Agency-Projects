"use client";

import { useState, useRef } from "react";

interface BriefInputProps {
  onGenerate: (brief: string) => void;
  isLoading: boolean;
}

export default function BriefInput({ onGenerate, isLoading }: BriefInputProps) {
  const [brief, setBrief] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brief.trim() && !isLoading) {
      onGenerate(brief.trim());
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    // Also allow by extension for cases where MIME type isn't set correctly
    const allowedExtensions = [".txt", ".md", ".pdf", ".doc", ".docx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      alert("Unsupported file type. Please upload a .txt, .md, .pdf, .doc, or .docx file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    try {
      if (file.type === "application/pdf") {
        // For PDFs, read as text (basic extraction)
        const text = await readFileAsText(file);
        setBrief(text.slice(0, 2000));
        setFileName(file.name);
      } else {
        const text = await readFileAsText(file);
        setBrief(text.slice(0, 2000));
        setFileName(file.name);
      }
    } catch {
      alert("Failed to read file. Please try again or paste your brief manually.");
    }

    // Reset the input so the same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const clearFile = () => {
    setFileName(null);
    setBrief("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="brief"
            className="block font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase"
          >
            Creative Brief
          </label>

          {/* Upload button */}
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
                  title="Clear uploaded file"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 border border-dark-border px-3 py-1.5 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest transition-all hover:border-cream-muted hover:text-cream-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1V10M7 1L4 4M7 1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 10V12C1 12.5523 1.44772 13 2 13H12C12.5523 13 13 12.5523 13 12V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload Brief
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <textarea
          id="brief"
          value={brief}
          onChange={(e) => {
            setBrief(e.target.value);
            if (fileName) setFileName(null);
          }}
          placeholder="Describe your project, brand, or creative vision... or upload a brief file above."
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
