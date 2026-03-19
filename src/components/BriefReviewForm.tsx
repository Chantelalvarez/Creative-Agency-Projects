"use client";

import { useState } from "react";
import { StructuredBrief } from "@/lib/types";

const BRIEF_FIELDS: {
  key: keyof StructuredBrief;
  label: string;
  description: string;
  rows: number;
  span?: boolean;
}[] = [
  { key: "projectName", label: "Project Name", description: "What is this project called?", rows: 1 },
  { key: "brandName", label: "Brand Name", description: "The brand or product name", rows: 1 },
  { key: "clientBackground", label: "Client Background", description: "Who is the client and what do they do?", rows: 2, span: true },
  { key: "projectScope", label: "Project Scope", description: "Branding, packaging, product, or a combination", rows: 2, span: true },
  { key: "brandImage", label: "Brand Image", description: "How should the brand feel? e.g. high-end, natural, minimal, playful", rows: 2, span: true },
  { key: "targetAudience", label: "Target Audience", description: "Age, gender, occupation, lifestyle", rows: 2, span: true },
  { key: "competitorBrands", label: "Competitor Brands", description: "Any competitor or reference brands mentioned", rows: 2, span: true },
  { key: "lookAndFeel", label: "Look & Feel", description: "Mood, tone, visual references, aesthetic direction", rows: 3, span: true },
  { key: "colourDirection", label: "Colour Direction", description: "Any colours, palettes, or colour moods mentioned", rows: 2, span: true },
  { key: "deliverables", label: "Deliverables", description: "What needs to be designed or created?", rows: 2, span: true },
  { key: "timeline", label: "Timeline", description: "Any deadlines or timeframes mentioned", rows: 1 },
  { key: "otherNotes", label: "Other Notes", description: "Anything else relevant to the project", rows: 3, span: true },
];

interface BriefReviewFormProps {
  brief: StructuredBrief;
  onGenerate: (brief: StructuredBrief) => void;
  onBack: () => void;
}

export default function BriefReviewForm({ brief, onGenerate, onBack }: BriefReviewFormProps) {
  const [form, setForm] = useState<StructuredBrief>(brief);

  const handleChange = (key: keyof StructuredBrief, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const filledCount = Object.values(form).filter((v) => v && v.trim()).length;
  const totalCount = BRIEF_FIELDS.length;

  return (
    <div>
      {/* Extraction summary bar */}
      <div className="mb-6 flex items-center gap-4 border border-dark-border bg-dark-surface px-4 py-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-cream-muted/60 uppercase tracking-widest">
              Fields extracted
            </span>
            <span className="font-mono text-[10px] text-cream-muted/60">
              {filledCount}/{totalCount}
            </span>
          </div>
          <div className="h-px bg-dark-border w-full relative">
            <div
              className="absolute top-0 left-0 h-px bg-cream transition-all duration-500"
              style={{ width: `${(filledCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {BRIEF_FIELDS.map((field) => (
          <div key={field.key} className={field.span ? "sm:col-span-2" : ""}>
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
              className="w-full resize-none border border-dark-border bg-dark-surface px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream-muted/30 focus:border-cream-muted/60 focus:outline-none transition-colors leading-relaxed"
              placeholder="— not captured —"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-dark-border">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-xs text-cream-muted/50 hover:text-cream transition-colors"
        >
          ← Back to input
        </button>
        <button
          type="button"
          onClick={() => onGenerate(form)}
          className="border border-cream bg-transparent px-10 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
        >
          Generate Mood Boards →
        </button>
      </div>
    </div>
  );
}
