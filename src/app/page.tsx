"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import dynamic from "next/dynamic";
import BriefReviewForm from "@/components/BriefReviewForm";
import ColorPalette from "@/components/ColorPalette";
import MoodKeywords from "@/components/MoodKeywords";
import TypographyDirection from "@/components/TypographyDirection";
import ImageGrid from "@/components/ImageGrid";
import CreativeDirections from "@/components/CreativeDirections";
import { StructuredBrief, MoodBoardRoute, UnsplashImage } from "@/lib/types";

const VoiceDictation = dynamic(() => import("@/components/VoiceDictation"), {
  ssr: false,
});

type AppStep = "input" | "extracting" | "review" | "generating" | "results";
type InputMode = "transcript" | "upload" | "dictate";

const INPUT_TABS: { id: InputMode; label: string; desc: string }[] = [
  { id: "transcript", label: "Paste Transcript", desc: "Paste meeting notes or Fireflies export" },
  { id: "upload", label: "Upload File", desc: ".txt or .docx only" },
  { id: "dictate", label: "Dictate Notes", desc: "Record spoken input" },
];

const STEP_LABELS = ["Input", "Review", "Generate"];

function StepIndicator({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-5 flex items-center justify-center border font-mono text-[10px] transition-all ${
                i < current
                  ? "border-cream-muted/40 text-cream-muted/40"
                  : i === current
                  ? "border-cream bg-cream text-dark"
                  : "border-dark-border text-cream-muted/20"
              }`}
            >
              {i < current ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 4L3 6L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`font-mono text-[10px] tracking-widest uppercase transition-all ${
                i === current ? "text-cream" : "text-cream-muted/30"
              }`}
            >
              {label}
            </span>
          </div>
          {i < 2 && <div className="h-px w-8 bg-dark-border" />}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("input");
  const [inputMode, setInputMode] = useState<InputMode>("transcript");

  // Input state
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow state
  const [extractedBrief, setExtractedBrief] = useState<StructuredBrief | null>(null);
  const [routes, setRoutes] = useState<MoodBoardRoute[]>([]);
  const [routeImages, setRouteImages] = useState<(UnsplashImage[] | null)[]>([null, null, null]);
  const [loadingImages, setLoadingImages] = useState<boolean[]>([false, false, false]);
  const [activeRoute, setActiveRoute] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ─── File upload ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".txt", ".docx"].includes(ext)) {
      setFileError("Unsupported file type. Please upload a .txt or .docx file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Maximum size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsParsingFile(true);
    setFileName(file.name);

    try {
      if (ext === ".txt") {
        const text = await file.text();
        setFileText(text.slice(0, 10000));
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-file", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Failed to parse file.");
        const { text } = await res.json();
        setFileText(text.slice(0, 10000));
      }
    } catch {
      setFileError("Failed to read file. Please try again.");
      setFileName(null);
      setFileText("");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    setFileName(null);
    setFileText("");
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Extract brief ──────────────────────────────────────────────────────────

  const handleExtract = async (text: string, inputType: "transcript" | "dictation") => {
    setError(null);
    setStep("extracting");

    try {
      const res = await fetch("/api/extract-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: text.trim(), inputType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to extract brief.");
      }

      const { brief } = await res.json();
      setExtractedBrief(brief);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("input");
    }
  };

  // ─── Generate mood boards ────────────────────────────────────────────────────

  const handleGenerate = async (brief: StructuredBrief) => {
    setError(null);
    setExtractedBrief(brief);
    setStep("generating");
    setRoutes([]);
    setRouteImages([null, null, null]);
    setLoadingImages([false, false, false]);
    setActiveRoute(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate mood boards.");
      }

      const { routes: generatedRoutes } = await res.json();
      setRoutes(generatedRoutes);
      setStep("results");

      // Fetch images for all 3 routes in parallel
      setLoadingImages([true, true, true]);
      generatedRoutes.forEach(async (route: MoodBoardRoute, i: number) => {
        try {
          const imgRes = await fetch("/api/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchTerms: route.visualSearchTerms }),
          });
          if (imgRes.ok) {
            const { images } = await imgRes.json();
            setRouteImages((prev) => {
              const next = [...prev];
              next[i] = images;
              return next;
            });
          }
        } finally {
          setLoadingImages((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("review");
    }
  };

  // ─── Reset ──────────────────────────────────────────────────────────────────

  const handleStartOver = () => {
    setStep("input");
    setPastedText("");
    setFileName(null);
    setFileText("");
    setFileError(null);
    setExtractedBrief(null);
    setRoutes([]);
    setRouteImages([null, null, null]);
    setLoadingImages([false, false, false]);
    setActiveRoute(0);
    setError(null);
  };

  const activeRouteData = routes[activeRoute];

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-6 pt-28 pb-20">

        {/* ── STEP 1: INPUT ─────────────────────────────────────────────────── */}
        {step === "input" && (
          <div className="max-w-2xl">
            <div className="mb-10">
              <h1 className="mb-3 font-sans text-4xl font-bold tracking-tight text-cream sm:text-5xl">
                Mood Board
                <br />
                <span className="text-cream-muted">Generator</span>
              </h1>
              <p className="font-mono text-sm text-cream-muted/70 leading-relaxed max-w-md">
                Share your client brief — paste a transcript, upload a file, or dictate notes.
                Claude will extract the key details so you can review them before generating.
              </p>
            </div>

            <StepIndicator current={0} />

            {/* Input tabs */}
            <div className="mb-6">
              <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-3">
                Choose your input method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {INPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setInputMode(tab.id)}
                    className={`border px-3 py-3 text-left transition-all ${
                      inputMode === tab.id
                        ? "border-cream bg-cream/5"
                        : "border-dark-border hover:border-cream-muted/40"
                    }`}
                  >
                    <span
                      className={`block font-sans text-xs font-semibold ${
                        inputMode === tab.id ? "text-cream" : "text-cream-muted/70"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="block font-mono text-[10px] text-cream-muted/40 mt-0.5">
                      {tab.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Paste transcript ── */}
            {inputMode === "transcript" && (
              <div className="space-y-4">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your meeting transcript, Fireflies notes, or any meeting notes here..."
                  rows={9}
                  maxLength={10000}
                  className="w-full resize-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/40 focus:border-cream-muted focus:outline-none transition-colors"
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cream-muted/50">
                    {pastedText.length}/10,000
                  </span>
                  <button
                    onClick={() => handleExtract(pastedText, "transcript")}
                    disabled={!pastedText.trim()}
                    className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
                  >
                    Extract Brief →
                  </button>
                </div>
              </div>
            )}

            {/* ── Upload file ── */}
            {inputMode === "upload" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
                    Transcript File
                  </label>
                  <div className="flex items-center gap-3">
                    {fileName && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-cream-muted/60 max-w-[140px] truncate">
                          {fileName}
                        </span>
                        <button
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsingFile}
                      className="flex items-center gap-2 border border-dark-border px-3 py-1.5 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest transition-all hover:border-cream-muted hover:text-cream-muted disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isParsingFile ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1V10M7 1L4 4M7 1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1 10V12C1 12.5523 1.44772 13 2 13H12C12.5523 13 13 12.5523 13 12V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {isParsingFile ? "Reading..." : "Upload File"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {fileError && (
                  <p className="font-mono text-xs text-red-400">{fileError}</p>
                )}

                {fileText ? (
                  <>
                    <textarea
                      value={fileText}
                      onChange={(e) => setFileText(e.target.value)}
                      rows={9}
                      className="w-full resize-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream focus:border-cream-muted focus:outline-none transition-colors"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-cream-muted/50">
                        {fileText.length}/10,000 chars
                      </span>
                      <button
                        onClick={() => handleExtract(fileText, "transcript")}
                        className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
                      >
                        Extract Brief →
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingFile}
                    className="flex h-44 w-full flex-col items-center justify-center border border-dashed border-dark-border bg-dark-surface transition-colors hover:border-cream-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-3 text-cream-muted/40">
                      <path d="M12 2V16M12 2L8 6M12 2L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="font-mono text-sm text-cream-muted/50">Click to upload a file</p>
                    <p className="font-mono text-[10px] text-cream-muted/30 mt-1">.txt or .docx — max 10MB</p>
                  </button>
                )}
              </div>
            )}

            {/* ── Dictate ── */}
            {inputMode === "dictate" && (
              <VoiceDictation
                onComplete={(text) => handleExtract(text, "dictation")}
              />
            )}

            {error && (
              <div className="mt-6 border border-red-500/30 bg-red-500/5 p-4">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2a: EXTRACTING ────────────────────────────────────────────── */}
        {step === "extracting" && (
          <div className="max-w-2xl">
            <StepIndicator current={1} />
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-sans text-2xl font-bold text-cream">Extracting Brief</h2>
                <p className="font-mono text-sm text-cream-muted/70 max-w-sm">
                  Claude is reading your transcript and pulling out the key project details.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border border-cream border-t-transparent" />
                <span className="font-mono text-xs text-cream-muted/60">Analysing transcript...</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2b: REVIEW ───────────────────────────────────────────────── */}
        {step === "review" && extractedBrief && (
          <div className="max-w-3xl">
            <StepIndicator current={1} />
            <div className="mb-8">
              <h2 className="font-sans text-2xl font-bold text-cream mb-2">Review Brief</h2>
              <p className="font-mono text-sm text-cream-muted/70 max-w-xl">
                Claude has extracted the following from your transcript. Review and edit anything
                that needs correcting or filling in before generating.
              </p>
            </div>

            {error && (
              <div className="mb-6 border border-red-500/30 bg-red-500/5 p-4">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}

            <BriefReviewForm
              brief={extractedBrief}
              onGenerate={handleGenerate}
              onBack={() => setStep("input")}
            />
          </div>
        )}

        {/* ── STEP 3a: GENERATING ───────────────────────────────────────────── */}
        {step === "generating" && (
          <div className="max-w-2xl">
            <StepIndicator current={2} />
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-sans text-2xl font-bold text-cream">Generating Mood Boards</h2>
                <p className="font-mono text-sm text-cream-muted/70 max-w-sm">
                  Creating three distinct creative directions from your brief.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                {["Route A", "Route B", "Route C"].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 animate-spin rounded-full border border-cream/50 border-t-cream"
                      style={{ animationDelay: `${i * 0.25}s` }}
                    />
                    <span className="font-mono text-xs text-cream-muted/50 uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3b: RESULTS ──────────────────────────────────────────────── */}
        {step === "results" && routes.length > 0 && (
          <div>
            {/* Results header */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-2">
                  Mood Boards
                </p>
                <h2 className="font-sans text-3xl font-bold text-cream">
                  {extractedBrief?.projectName || extractedBrief?.brandName || "Creative Directions"}
                </h2>
                {extractedBrief?.clientBackground && (
                  <p className="font-mono text-sm text-cream-muted/50 mt-1 max-w-md truncate">
                    {extractedBrief.clientBackground}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setStep("review")}
                  className="font-mono text-xs text-cream-muted/50 hover:text-cream transition-colors"
                >
                  ← Edit brief
                </button>
                <button
                  onClick={handleStartOver}
                  className="font-mono text-xs text-cream-muted/50 hover:text-cream transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>

            {/* Route tabs */}
            <div className="flex gap-0 border-b border-dark-border mb-12">
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

            {/* Active route */}
            {activeRouteData && (
              <div className="space-y-16 animate-fade-in" key={activeRoute}>
                {/* Direction statement */}
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

                <TypographyDirection direction={activeRouteData.typographyDirection} />

                <div className="h-px bg-dark-border" />

                <ImageGrid
                  images={routeImages[activeRoute] ?? []}
                  isLoading={loadingImages[activeRoute]}
                />

                <div className="h-px bg-dark-border" />

                <CreativeDirections directions={activeRouteData.creativeDirections} />

                <div className="border-t border-dark-border pt-8 text-center">
                  <p className="font-mono text-[10px] text-cream-muted/30 tracking-widest uppercase">
                    Generated by Antareslabs AI Mood Board Generator
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
