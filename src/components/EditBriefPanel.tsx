"use client";

import { useState, useEffect } from "react";
import { StructuredBrief } from "@/lib/types";

const BRIEF_FIELDS: {
  key: keyof StructuredBrief;
  label: string;
  description: string;
  rows: number;
  span?: boolean;
}[] = [
  { key: "projectName", label: "Project Name", description: "Name of the project or campaign", rows: 1 },
  { key: "brandName", label: "Brand Name", description: "The brand or product name", rows: 1 },
  { key: "clientBackground", label: "Client Background", description: "Who the client is and what they do", rows: 2, span: true },
  { key: "projectScope", label: "Project Scope", description: "Branding, packaging, product, or a combination", rows: 2, span: true },
  { key: "brandImage", label: "Brand Image", description: "How the brand should feel — e.g. high-end, natural, minimal, playful", rows: 2, span: true },
  { key: "targetAudience", label: "Target Audience", description: "Age, gender, occupation, lifestyle", rows: 2, span: true },
  { key: "competitorBrands", label: "Competitor Brands", description: "Competitor or reference brands mentioned", rows: 2, span: true },
  { key: "lookAndFeel", label: "Look & Feel", description: "Mood, tone, visual references, aesthetic direction", rows: 3, span: true },
  { key: "colourDirection", label: "Colour Direction", description: "Any colours, palettes, or colour moods mentioned", rows: 2, span: true },
  { key: "deliverables", label: "Deliverables", description: "What needs to be designed or created", rows: 2, span: true },
  { key: "timeline", label: "Timeline", description: "Any deadlines or timeframes", rows: 1 },
  { key: "otherNotes", label: "Other Notes", description: "Anything else relevant to the project", rows: 3, span: true },
];

interface EditBriefPanelProps {
  brief: StructuredBrief;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (brief: StructuredBrief) => void;
}

export default function EditBriefPanel({
  brief,
  isOpen,
  onClose,
  onRegenerate,
}: EditBriefPanelProps) {
  const [form, setForm] = useState<StructuredBrief>(brief);

  // Sync when brief changes externally (e.g. after a new extraction)
  useEffect(() => {
    setForm(brief);
  }, [brief]);

  const handleChange = (key: keyof StructuredBrief, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-dark/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-dark-surface border-l border-dark-border flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0">
          <div>
            <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest">
              Edit
            </p>
            <h3 className="font-sans text-sm font-bold text-cream mt-0.5">
              Project Brief
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-cream-muted/40 hover:text-cream transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M14 4L4 14M4 4L14 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {BRIEF_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block mb-1.5">
                  <span className="font-sans text-[10px] font-semibold tracking-[0.2em] text-cream-muted uppercase">
                    {field.label}
                  </span>
                  <span className="block font-mono text-[10px] text-cream-muted/40 mt-0.5">
                    {field.description}
                  </span>
                </label>
                <textarea
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.rows}
                  placeholder="— not captured —"
                  className="w-full resize-none border border-dark-border bg-dark px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream-muted/30 focus:border-cream-muted/60 focus:outline-none transition-colors leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-border shrink-0">
          <p className="font-mono text-[10px] text-cream-muted/40 mb-3">
            Changes will trigger a full regeneration of mood boards and competitor research.
          </p>
          <button
            onClick={() => onRegenerate(form)}
            className="w-full border border-cream bg-transparent py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
          >
            Regenerate →
          </button>
        </div>
      </div>
    </>
  );
}
