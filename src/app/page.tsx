"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import dynamic from "next/dynamic";
import EditBriefPanel from "@/components/EditBriefPanel";
import BriefDisplay from "@/components/BriefDisplay";
import CompetitorSection from "@/components/CompetitorSection";
import ColorPalette from "@/components/ColorPalette";
import MoodKeywords from "@/components/MoodKeywords";
import TypographyDirection from "@/components/TypographyDirection";
import ImageGrid from "@/components/ImageGrid";
import CreativeDirections from "@/components/CreativeDirections";
import {
  StructuredBrief,
  MoodBoardRoute,
  UnsplashImage,
  CompetitorAnalysis,
  CreativeDocument,
  UploadedFile,
} from "@/lib/types";
import LZString from "lz-string";
import ContextUploader from "@/components/ContextUploader";

const VoiceDictation = dynamic(() => import("@/components/VoiceDictation"), {
  ssr: false,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type AppStep = "input" | "generating" | "results";
type InputMode = "transcript" | "upload" | "dictate";
type ProgressState = "idle" | "loading" | "done" | "error";

const INPUT_TABS: { id: InputMode; label: string; desc: string }[] = [
  { id: "transcript", label: "Paste Transcript", desc: "Paste meeting notes or Fireflies export" },
  { id: "upload", label: "Upload File", desc: ".pdf, .txt or .docx" },
  { id: "dictate", label: "Dictate Notes", desc: "Record spoken input" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseCompetitorNames(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]+|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
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

function ProgressRow({
  label,
  state,
}: {
  label: string;
  state: ProgressState;
}) {
  return (
    <div className="flex items-center gap-3">
      {state === "done" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-400 shrink-0">
          <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === "error" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-red-400 shrink-0">
          <path d="M7 2V8M7 10.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : state === "loading" ? (
        <span className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-cream/50 border-t-cream" />
      ) : (
        <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-dark-border" />
      )}
      <span
        className={`font-mono text-xs uppercase tracking-widest transition-colors ${
          state === "done"
            ? "text-green-400"
            : state === "error"
            ? "text-red-400"
            : state === "loading"
            ? "text-cream"
            : "text-cream-muted/30"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<AppStep>("input");
  const [inputMode, setInputMode] = useState<InputMode>("transcript");

  // ── Input state ──────────────────────────────────────────────────────────
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Results state ────────────────────────────────────────────────────────
  const [extractedBrief, setExtractedBrief] = useState<StructuredBrief | null>(null);
  const [routes, setRoutes] = useState<MoodBoardRoute[]>([]);
  const [routeImages, setRouteImages] = useState<(UnsplashImage[] | null)[]>([null, null, null]);
  const [loadingImages, setLoadingImages] = useState<boolean[]>([false, false, false]);
  const [activeRoute, setActiveRoute] = useState(0);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  // ── Context uploads ──────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // ── Generation progress ──────────────────────────────────────────────────
  const [progBrief, setProgBrief] = useState<ProgressState>("idle");
  const [progUploads, setProgUploads] = useState<ProgressState>("idle");
  const [progMoodboards, setProgMoodboards] = useState<ProgressState>("idle");
  const [progCompetitors, setProgCompetitors] = useState<ProgressState>("idle");

  // ── Edit brief panel ─────────────────────────────────────────────────────
  const [editPanelOpen, setEditPanelOpen] = useState(false);

  // ── Export ───────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  const documentRef = useRef<HTMLDivElement>(null);

  // ─── File upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".txt", ".docx", ".pdf"].includes(ext)) {
      setFileError("Please upload a .pdf, .txt or .docx file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Maximum 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsParsingFile(true);
    setFileName(file.name);
    try {
      if (ext === ".txt") {
        setFileText((await file.text()).slice(0, 10000));
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/parse-file", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
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

  // ─── Core generation orchestrator ─────────────────────────────────────────
  // Called with raw text (from any input method) and whether to skip extraction
  // (skipExtract = true when regenerating from an already-edited brief)

  const runGeneration = async (
    brief: StructuredBrief,
    isRegenerate = false,
    uploadContext = ""
  ) => {
    setError(null);
    setStep("generating");
    setRoutes([]);
    setRouteImages([null, null, null]);
    setLoadingImages([false, false, false]);
    setCompetitorAnalysis(null);
    setCompetitorError(null);
    setActiveRoute(0);

    setProgBrief(isRegenerate ? "done" : "loading");
    setProgMoodboards("idle");
    setProgCompetitors("idle");

    // ── Competitor research (fire in background once brief is ready) ──────
    const fireCompetitorResearch = (b: StructuredBrief) => {
      const names = parseCompetitorNames(b.competitorBrands);
      if (names.length === 0) {
        setProgCompetitors("done");
        return;
      }
      setProgCompetitors("loading");
      setLoadingCompetitors(true);
      fetch("/api/research-competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: names, brief: b }),
      })
        .then((r) => r.json())
        .then(({ analysis, error: e }) => {
          if (e) {
            setCompetitorError(e);
            setProgCompetitors("error");
          } else {
            setCompetitorAnalysis(analysis ?? null);
            setProgCompetitors("done");
          }
        })
        .catch(() => {
          setCompetitorError("Failed to research competitors.");
          setProgCompetitors("error");
        })
        .finally(() => setLoadingCompetitors(false));
    };

    let resolvedBrief = brief;

    try {
      // ── Mood board generation (awaited — results drive the step change) ──
      setProgMoodboards("loading");
      fireCompetitorResearch(resolvedBrief);

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: resolvedBrief, uploadContext }),
      });
      if (!genRes.ok) {
        const d = await genRes.json();
        throw new Error(d.error || "Failed to generate mood boards.");
      }
      const { routes: generatedRoutes } = await genRes.json();
      setRoutes(generatedRoutes);
      setProgMoodboards("done");
      setStep("results");

      // ── Load images for all routes in parallel ─────────────────────────
      setLoadingImages([true, true, true]);
      generatedRoutes.forEach(async (route: MoodBoardRoute, i: number) => {
        try {
          const ir = await fetch("/api/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchTerms: route.visualSearchTerms }),
          });
          if (ir.ok) {
            const { images } = await ir.json();
            setRouteImages((prev) => {
              const n = [...prev];
              n[i] = images;
              return n;
            });
          }
        } finally {
          setLoadingImages((prev) => {
            const n = [...prev];
            n[i] = false;
            return n;
          });
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setProgMoodboards("error");
      // Stay on input if we never had results; otherwise return to results
      setStep(routes.length > 0 ? "results" : "input");
    }
  };

  // Convert UploadedFile to the payload expected by /api/analyze-uploads
  const prepareUploadPayload = async (files: UploadedFile[]) => {
    const ready = files.filter((f) => !f.isProcessing && !f.error);
    return Promise.all(
      ready.map(async (f) => {
        if (f.fileType === "video") {
          return { name: f.name, fileType: "video" as const, videoFrames: f.videoFrames ?? [] };
        }
        // Read file as base64
        const buffer = await f.file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        const data = btoa(binary);
        return { name: f.name, fileType: f.fileType, mediaType: f.file.type, data };
      })
    );
  };

  // Entry point from the input step (has raw text, needs extraction first)
  const handleGenerateFromText = async (
    text: string,
    inputType: "transcript" | "dictation"
  ) => {
    setError(null);
    setStep("generating");
    setProgUploads("idle");
    setProgBrief("loading");
    setProgMoodboards("idle");
    setProgCompetitors("idle");
    setRoutes([]);
    setRouteImages([null, null, null]);
    setCompetitorAnalysis(null);
    setCompetitorError(null);
    setActiveRoute(0);

    // Step 1: Analyze uploads (if any) — runs in parallel with nothing yet
    let uploadContext = "";
    const readyUploads = uploadedFiles.filter((f) => !f.isProcessing && !f.error);
    if (readyUploads.length > 0) {
      setProgUploads("loading");
      try {
        const payload = await prepareUploadPayload(readyUploads);
        const res = await fetch("/api/analyze-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: payload }),
        });
        if (res.ok) {
          const { context } = await res.json();
          uploadContext = context ?? "";
        }
        setProgUploads("done");
      } catch {
        // Non-fatal — continue without upload context
        setProgUploads("done");
      }
    }

    // Step 2: Extract brief (with upload context if available)
    let brief: StructuredBrief;
    try {
      const extractRes = await fetch("/api/extract-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: text.trim(), inputType, uploadContext }),
      });
      if (!extractRes.ok) {
        const d = await extractRes.json();
        throw new Error(d.error || "Failed to extract brief.");
      }
      const { brief: extracted } = await extractRes.json();
      brief = extracted;
      setExtractedBrief(brief);
      setProgBrief("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract brief.");
      setProgBrief("error");
      setStep("input");
      return;
    }

    // Step 3: Generate everything in parallel (pass upload context through)
    await runGeneration(brief, true, uploadContext);
  };

  // Entry point from the edit panel (brief already known, skip extraction)
  const handleRegenerate = async (updatedBrief: StructuredBrief) => {
    setEditPanelOpen(false);
    setExtractedBrief(updatedBrief);
    await runGeneration(updatedBrief, true);
  };

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    if (!extractedBrief) return;
    setExporting(true);
    setError(null);
    try {
      const jsPDFModule = await import("jspdf");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF = (jsPDFModule as any).default ?? (jsPDFModule as any).jsPDF;

      const projectName = extractedBrief.projectName || extractedBrief.brandName || "Creative Package";
      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const ML = 14; // margin left
      const MR = W - 14; // margin right
      const TW = W - 28; // text width
      const dateStr = new Date()
        .toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
        .toUpperCase();

      // ── helpers ──────────────────────────────────────────────────────────────
      const newPage = () => {
        pdf.addPage();
        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, W, H, "F");
        // header rule
        pdf.setDrawColor(40, 40, 40);
        pdf.setLineWidth(0.2);
        pdf.line(ML, 20, MR, 20);
        // footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(60, 55, 50);
        pdf.text("ANTARESLABS — AI CREATIVE PACKAGE", ML, H - 10);
        pdf.text(dateStr, MR, H - 10, { align: "right" });
        return 28; // starting y
      };

      const label = (text: string, y: number) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 90, 75);
        pdf.text(text.toUpperCase(), ML, y);
        return y + 5;
      };

      const body = (text: string, y: number, maxLines = 999) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(210, 200, 185);
        const lines = pdf.splitTextToSize(text, TW).slice(0, maxLines);
        pdf.text(lines, ML, y);
        return y + lines.length * 5;
      };

      const rule = (y: number) => {
        pdf.setDrawColor(35, 35, 35);
        pdf.setLineWidth(0.2);
        pdf.line(ML, y, MR, y);
        return y + 8;
      };

      // ── COVER PAGE ───────────────────────────────────────────────────────────
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, W, H, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(245, 240, 232);
      pdf.text("ANTARESLABS", ML, 17);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(130, 120, 105);
      pdf.text("AI Creative Package", MR, 17, { align: "right" });

      pdf.setDrawColor(50, 50, 50);
      pdf.setLineWidth(0.3);
      pdf.line(ML, 26, MR, 26);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(30);
      pdf.setTextColor(245, 240, 232);
      pdf.text(pdf.splitTextToSize(projectName, TW), ML, 68);

      if (extractedBrief.brandName && extractedBrief.brandName !== projectName) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(130, 120, 105);
        pdf.text(extractedBrief.brandName, ML, 85);
      }

      if (extractedBrief.clientBackground) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(160, 150, 135);
        pdf.text(pdf.splitTextToSize(extractedBrief.clientBackground, TW).slice(0, 4), ML, 100);
      }

      if (routes.length > 0) {
        pdf.setDrawColor(40, 40, 40);
        pdf.line(ML, 128, MR, 128);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 90, 75);
        pdf.text("CREATIVE DIRECTIONS", ML, 137);
        routes.forEach((r, i) => {
          const y = 148 + i * 16;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(220, 210, 195);
          pdf.text(r.name, ML, y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(110, 100, 85);
          pdf.text(pdf.splitTextToSize(r.direction, TW - 20)[0] ?? "", ML + 20, y);
        });
      }

      pdf.setDrawColor(40, 40, 40);
      pdf.line(ML, H - 22, MR, H - 22);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(70, 65, 55);
      pdf.text(dateStr, ML, H - 12);

      // ── BRIEF PAGE ───────────────────────────────────────────────────────────
      let y = newPage();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(245, 240, 232);
      pdf.text("Project Brief", ML, y); y += 10;
      y = rule(y);

      const briefFields: [string, string][] = (
        [
          ["Project Scope", extractedBrief.projectScope],
          ["Target Audience", extractedBrief.targetAudience],
          ["Look & Feel", extractedBrief.lookAndFeel],
          ["Colour Direction", extractedBrief.colourDirection],
          ["Deliverables", extractedBrief.deliverables],
          ["Timeline", extractedBrief.timeline],
          ["Other Notes", extractedBrief.otherNotes],
        ] as [string, string][]
      ).filter(([, v]) => v?.trim());

      for (const [lbl, val] of briefFields) {
        if (y > H - 30) { y = newPage(); }
        y = label(lbl, y);
        y = body(val, y, 4);
        y += 6;
      }

      // ── ROUTE PAGES ──────────────────────────────────────────────────────────
      routes.forEach((route) => {
        y = newPage();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(245, 240, 232);
        pdf.text(route.name, ML, y); y += 7;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(140, 130, 115);
        pdf.text(pdf.splitTextToSize(route.direction, TW), ML, y);
        y += pdf.splitTextToSize(route.direction, TW).length * 5 + 6;
        y = rule(y);

        // Colour palette
        if (route.colorPalette?.length) {
          y = label("Colour Palette", y);
          route.colorPalette.forEach((c) => {
            if (y > H - 20) { y = newPage(); }
            // swatch
            const hex = c.hex.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            pdf.setFillColor(r, g, b);
            pdf.rect(ML, y - 3, 6, 4, "F");
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(200, 190, 175);
            pdf.text(`${c.hex}  ${c.name}`, ML + 9, y);
            y += 6;
          });
          y += 4;
        }

        // Mood keywords
        if (route.moodKeywords?.length) {
          if (y > H - 20) { y = newPage(); }
          y = label("Mood Keywords", y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(180, 170, 155);
          pdf.text(route.moodKeywords.join("  ·  "), ML, y);
          y += 10;
        }

        // Typography
        if (route.typographyDirection) {
          if (y > H - 30) { y = newPage(); }
          y = label("Typography", y);
          const t = route.typographyDirection;
          if (t.headingStyle) { y = body(`Heading: ${t.headingStyle}`, y); }
          if (t.bodyStyle) { y = body(`Body: ${t.bodyStyle}`, y); }
          if (t.notes) { y = body(t.notes, y, 2); }
          y += 4;
        }

        // Creative directions
        if (route.creativeDirections?.length) {
          if (y > H - 30) { y = newPage(); }
          y = label("Creative Directions", y);
          route.creativeDirections.forEach((d) => {
            if (y > H - 20) { y = newPage(); }
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(180, 170, 155);
            const lines = pdf.splitTextToSize(`— ${d}`, TW);
            pdf.text(lines, ML, y);
            y += lines.length * 5 + 2;
          });
        }
      });

      pdf.save(`${projectName.toLowerCase().replace(/\s+/g, "-")}-creative-package.pdf`);

    } catch (err) {
      console.error("PDF export error:", err);
      setError("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleShareLink = async () => {
    if (!extractedBrief) return;
    const doc: CreativeDocument = {
      brief: extractedBrief,
      competitorAnalysis: competitorAnalysis ?? null,
      routes,
      routeImages,
      generatedAt: new Date().toISOString(),
    };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(doc));
    const url = `${window.location.origin}/share?d=${compressed}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      window.open(url, "_blank");
    }
  };

  // ─── Save project ──────────────────────────────────────────────────────────

  const handleSaveProject = async () => {
    if (!extractedBrief || saving) return;
    setSaving(true);
    try {
      const doc: CreativeDocument = {
        brief: extractedBrief,
        competitorAnalysis: competitorAnalysis ?? null,
        routes,
        routeImages,
        generatedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: extractedBrief.projectName || extractedBrief.brandName || "Untitled Project",
          clientName: extractedBrief.brandName || null,
          data: doc,
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setSavedId(id);
      }
    } catch {
      // Non-fatal
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset ─────────────────────────────────────────────────────────────────

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
    setCompetitorAnalysis(null);
    setCompetitorError(null);
    setProgBrief("idle");
    setProgUploads("idle");
    setProgMoodboards("idle");
    setProgCompetitors("idle");
    setError(null);
    setEditPanelOpen(false);
    setUploadedFiles([]);
    setSavedId(null);
  };

  const projectName =
    extractedBrief?.projectName || extractedBrief?.brandName || "Creative Package";
  const activeRouteData = routes[activeRoute];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Header />

      {/* Edit Brief slide-out panel (available on results page) */}
      {extractedBrief && (
        <EditBriefPanel
          brief={extractedBrief}
          isOpen={editPanelOpen}
          onClose={() => setEditPanelOpen(false)}
          onRegenerate={handleRegenerate}
        />
      )}

      <main className="mx-auto min-h-screen max-w-7xl px-6 pt-28 pb-20">

        {/* ── STEP 1: INPUT ──────────────────────────────────────────────── */}
        {step === "input" && (
          <div className="max-w-2xl">
            <div className="mb-10">
              <h1 className="mb-3 font-sans text-4xl font-bold tracking-tight text-cream sm:text-5xl">
                Creative
                <br />
                <span className="text-cream-muted">Package Generator</span>
              </h1>
              <p className="font-mono text-sm text-cream-muted/70 leading-relaxed max-w-md">
                Share your client transcript. Claude will extract the brief,
                research competitors, and generate three distinct creative
                directions — all at once.
              </p>
            </div>

            {/* Input tabs */}
            <div className="mb-6">
              <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-3">
                Input method
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

            {/* Paste transcript */}
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
                    onClick={() => handleGenerateFromText(pastedText, "transcript")}
                    disabled={!pastedText.trim()}
                    className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
                  >
                    Generate →
                  </button>
                </div>
              </div>
            )}

            {/* Upload file */}
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
                        <button onClick={clearFile} className="text-cream-muted/40 hover:text-cream transition-colors">
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
                    <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
                  </div>
                </div>

                {fileError && <p className="font-mono text-xs text-red-400">{fileError}</p>}

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
                        onClick={() => handleGenerateFromText(fileText, "transcript")}
                        className="border border-cream bg-transparent px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
                      >
                        Generate →
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
                    <p className="font-mono text-[10px] text-cream-muted/30 mt-1">.pdf, .txt or .docx — max 10MB</p>
                  </button>
                )}
              </div>
            )}

            {/* Dictate */}
            {inputMode === "dictate" && (
              <VoiceDictation
                onComplete={(text) => handleGenerateFromText(text, "dictation")}
              />
            )}

            {/* Context uploads — always visible below input method */}
            <div className="mt-8 pt-8 border-t border-dark-border">
              <ContextUploader onChange={setUploadedFiles} />
            </div>

            {error && (
              <div className="mt-6 border border-red-500/30 bg-red-500/5 p-4">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: GENERATING ─────────────────────────────────────────── */}
        {step === "generating" && (
          <div className="max-w-sm">
            <div className="mb-8">
              <h2 className="font-sans text-2xl font-bold text-cream mb-2">
                Building Package
              </h2>
              <p className="font-mono text-sm text-cream-muted/60">
                This takes about 30–60 seconds.
              </p>
            </div>

            <div className="space-y-4">
              {progUploads !== "idle" && (
                <ProgressRow label="Analysing reference uploads" state={progUploads} />
              )}
              <ProgressRow label="Reading transcript" state={progBrief} />
              <ProgressRow label="Generating mood boards" state={progMoodboards} />
              <ProgressRow label="Researching competitors" state={progCompetitors} />
              <ProgressRow label="Loading visual references" state="idle" />
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ────────────────────────────────────────────── */}
        {step === "results" && routes.length > 0 && (
          <div>
            {/* ── Sticky action bar ─────────────────────────────────────── */}
            <div className="sticky top-16 z-40 -mx-6 px-6 border-b border-dark-border bg-dark/95 backdrop-blur-md mb-14">
              <div className="flex items-center justify-between py-3 gap-4">
                {/* Left: project name + edit brief */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest">
                      Creative Package
                    </p>
                    <p className="font-sans text-sm font-semibold text-cream truncate">
                      {projectName}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditPanelOpen(true)}
                    className="shrink-0 flex items-center gap-1.5 border border-dark-border px-3 py-1.5 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest transition-all hover:border-cream-muted/60 hover:text-cream-muted"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M7 1.5L8.5 3L3.5 8H2V6.5L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit brief
                  </button>
                </div>

                {/* Right: export actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Save to account (only shown when logged in) */}
                  {session?.user && (
                    <button
                      onClick={handleSaveProject}
                      disabled={saving || !!savedId}
                      className="flex items-center gap-1.5 border border-dark-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed text-cream-muted/60 hover:border-cream-muted/60 hover:text-cream-muted"
                    >
                      {saving ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : savedId ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 1.5V6.5M5 6.5L3 4.5M5 6.5L7 4.5M1.5 8.5H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {saving ? "Saving…" : savedId ? "Saved" : "Save"}
                    </button>
                  )}
                  <button
                    onClick={handleShareLink}
                    className="flex items-center gap-1.5 border border-dark-border px-3 py-1.5 font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest transition-all hover:border-cream-muted/60 hover:text-cream-muted"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M6.5 1.5H8.5V3.5M8.5 1.5L4 6M4 2.5H1.5V8.5H7.5V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {shareCopied ? "Copied!" : "Share"}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="flex items-center gap-1.5 border border-cream px-3 py-1.5 font-mono text-[10px] text-cream uppercase tracking-widest transition-all hover:bg-cream hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1V7M5 7L3 5M5 7L7 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 7.5V8.5C1 8.77614 1.22386 9 1.5 9H8.5C8.77614 9 9 8.77614 9 8.5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    {exporting ? "Exporting..." : "PDF"}
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="font-mono text-[10px] text-cream-muted/30 uppercase tracking-widest hover:text-cream transition-colors px-1"
                  >
                    New
                  </button>
                </div>
              </div>
            </div>

            {/* ── Document (captured for PDF) ─────────────────────────── */}
            <div ref={documentRef} className="space-y-20">

              {/* SECTION 01 — PROJECT BRIEF */}
              <section id="section-brief">
                <SectionLabel number="01" title="Project Brief" />
                {extractedBrief && <BriefDisplay brief={extractedBrief} />}
              </section>

              <div className="h-px bg-dark-border" />

              {/* SECTION 02 — COMPETITOR RESEARCH */}
              <section id="section-competitors">
                <SectionLabel number="02" title="Competitor Research" />
                <CompetitorSection
                  analysis={competitorAnalysis}
                  isLoading={loadingCompetitors}
                  error={competitorError}
                />
              </section>

              <div className="h-px bg-dark-border" />

              {/* SECTION 03 — CREATIVE DIRECTIONS */}
              <section id="section-routes">
                <SectionLabel number="03" title="Creative Directions" />

                {/* Route tabs */}
                <div className="flex border-b border-dark-border mb-12">
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
                    <TypographyDirection direction={activeRouteData.typographyDirection} />
                    <div className="h-px bg-dark-border" />
                    <ImageGrid images={routeImages[activeRoute] ?? []} isLoading={loadingImages[activeRoute]} />
                    <div className="h-px bg-dark-border" />
                    <CreativeDirections directions={activeRouteData.creativeDirections} />
                  </div>
                )}
              </section>

              <div className="border-t border-dark-border pt-8 text-center">
                <p className="font-mono text-[10px] text-cream-muted/30 tracking-widest uppercase">
                  Generated by Antareslabs AI Creative Package Generator
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
