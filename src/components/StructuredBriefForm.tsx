"use client";

import { useState } from "react";

interface StructuredBriefFormProps {
  onComplete: (brief: string) => void;
  isLoading: boolean;
}

const STEPS = [
  {
    id: "client_brand",
    label: "Client & Brand",
    question: "Who is the client and what is the brand?",
    hint: "Include parent company if relevant, brand tier, and where this brand sits in their portfolio.",
    placeholder: "e.g. Client: Luxe Group. Brand: Maison Soleil — their premium skincare line positioned between mid-market and prestige.",
    required: true,
  },
  {
    id: "business_problem",
    label: "Business Problem",
    question: "What business problem are we solving?",
    hint: "What's happening in the market, what's changed, or what opportunity has the client identified? This is the 'why' behind the project.",
    placeholder: "e.g. Brand awareness is low among Gen Z despite strong product reviews. Competitors like Glossier own the social conversation. Client needs to break through with a distinct visual identity.",
    required: true,
  },
  {
    id: "deliverables",
    label: "Deliverables & Scope",
    question: "What are we actually making?",
    hint: "Be specific — campaign, brand identity, packaging, social content, website, event? Include formats, channels, and any phasing.",
    placeholder: "e.g. Full rebrand: visual identity system, packaging for 12 SKUs, social templates (IG, TikTok), hero campaign (OOH + digital), brand guidelines document.",
    required: true,
  },
  {
    id: "audience",
    label: "Target Audience",
    question: "Who are we talking to?",
    hint: "Go beyond demographics. What do they care about? Where do they spend time? What brands do they already love? What tension or insight drives them?",
    placeholder: "e.g. Women 22-34, urban, university-educated. Skin-conscious but skeptical of 'clean beauty' marketing. Trust peer reviews over brand claims. Heavy IG and TikTok users. Currently buying The Ordinary and Drunk Elephant.",
    required: true,
  },
  {
    id: "single_message",
    label: "Single-Minded Message",
    question: "If the audience takes away one thing, what is it?",
    hint: "This is the core proposition. One sentence. What do we want them to think, feel, or believe after seeing the work?",
    placeholder: "e.g. Maison Soleil is skincare that doesn't try to be cool — it just is.",
    required: true,
  },
  {
    id: "tone_personality",
    label: "Tone & Brand Personality",
    question: "How should the brand feel?",
    hint: "Describe the personality as if the brand were a person. Include tone of voice, energy level, and any 'is this / not that' tensions.",
    placeholder: "e.g. Confident but never arrogant. Warm, editorial, slightly irreverent. Think: the friend who quietly has the best taste. NOT clinical, NOT loud, NOT 'girlboss energy'.",
    required: true,
  },
  {
    id: "visual_territory",
    label: "Visual Territory & References",
    question: "Any visual direction, references, or aesthetic guardrails?",
    hint: "Competitors to avoid looking like, brands or editorials they admire, colour preferences, photography style, typography instincts. Include any hard constraints.",
    placeholder: "e.g. Admires: Aesop's restraint, Jacquemus' warmth, The Row's quiet luxury. Avoid: anything that looks like Glossier or Fenty. Prefers earthy/neutral palette. Typography should feel considered, not trendy. Must work on both dark and light backgrounds.",
    required: false,
  },
  {
    id: "mandatories",
    label: "Mandatories & Constraints",
    question: "Any non-negotiables, legal requirements, or practical constraints?",
    hint: "Budget tier, timeline, existing brand elements that must be retained, regulatory requirements, stakeholder sensitivities, approval process.",
    placeholder: "e.g. Must retain existing logomark (can refine, not replace). EU cosmetics labelling compliance required. CMO is final approver. Tight timeline — concepts needed in 3 weeks. Photography budget is limited, explore illustration or AI-generated direction.",
    required: false,
  },
  {
    id: "success",
    label: "Success Criteria",
    question: "How will we know if the work is successful?",
    hint: "What does 'good' look like? Both measurable outcomes and subjective markers the client cares about.",
    placeholder: "e.g. 30% increase in brand-prompted recall among target demographic within 6 months. Creative team benchmark: would this get covered by It's Nice That? Client benchmark: 'I'd be proud to show this to our board.'",
    required: false,
  },
];

export default function StructuredBriefForm({
  onComplete,
  isLoading,
}: StructuredBriefFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const requiredCount = STEPS.filter((s) => s.required).length;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = step.required ? currentAnswer.trim().length > 0 : true;

  const handleNext = () => {
    if (step.required && !currentAnswer.trim()) return;

    const updated = { ...answers, [step.id]: currentAnswer.trim() };
    setAnswers(updated);

    if (isLastStep) {
      const brief = compileBrief(updated);
      onComplete(brief);
    } else {
      setCurrentStep(currentStep + 1);
      setCurrentAnswer(answers[STEPS[currentStep + 1]?.id] || "");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setAnswers({ ...answers, [step.id]: currentAnswer.trim() });
      setCurrentStep(currentStep - 1);
      setCurrentAnswer(answers[STEPS[currentStep - 1]?.id] || "");
    }
  };

  const handleSkip = () => {
    if (!step.required) {
      const updated = { ...answers, [step.id]: "" };
      setAnswers(updated);
      if (isLastStep) {
        const brief = compileBrief(updated);
        onComplete(brief);
      } else {
        setCurrentStep(currentStep + 1);
        setCurrentAnswer(answers[STEPS[currentStep + 1]?.id] || "");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const compileBrief = (data: Record<string, string>): string => {
    const sections: string[] = [];

    if (data.client_brand)
      sections.push(`Client & Brand: ${data.client_brand}`);
    if (data.business_problem)
      sections.push(`Business Problem: ${data.business_problem}`);
    if (data.deliverables)
      sections.push(`Deliverables: ${data.deliverables}`);
    if (data.audience)
      sections.push(`Target Audience: ${data.audience}`);
    if (data.single_message)
      sections.push(`Core Message: ${data.single_message}`);
    if (data.tone_personality)
      sections.push(`Tone & Personality: ${data.tone_personality}`);
    if (data.visual_territory)
      sections.push(`Visual Direction: ${data.visual_territory}`);
    if (data.mandatories)
      sections.push(`Mandatories: ${data.mandatories}`);
    if (data.success)
      sections.push(`Success Criteria: ${data.success}`);

    return sections.join("\n\n");
  };

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest">
            Step {currentStep + 1} of {STEPS.length}
            {step.required && (
              <span className="ml-2 text-cream-muted/30">Required</span>
            )}
            {!step.required && (
              <span className="ml-2 text-cream-muted/30">Optional</span>
            )}
          </span>
          <span className="font-mono text-[10px] text-cream-muted/50">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-px bg-dark-border w-full relative">
          <div
            className="h-px bg-cream transition-all duration-300 absolute top-0 left-0"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex gap-1 mt-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-0.5 flex-1 transition-colors ${
                i <= currentStep
                  ? "bg-cream/40"
                  : answers[s.id]
                  ? "bg-cream/20"
                  : "bg-dark-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-2">
        <label className="block font-sans text-sm font-semibold text-cream mb-1">
          {step.question}
        </label>
        <span className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest">
          {step.label}
        </span>
      </div>

      {/* Hint */}
      <p className="font-mono text-[11px] text-cream-muted/50 leading-relaxed mb-4">
        {step.hint}
      </p>

      {/* Input */}
      <textarea
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={step.placeholder}
        rows={4}
        className="w-full resize-none rounded-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/30 focus:border-cream-muted focus:outline-none transition-colors mb-4"
        disabled={isLoading}
        autoFocus
      />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="font-mono text-xs text-cream-muted/50 hover:text-cream transition-colors disabled:opacity-0 disabled:cursor-default"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          {!step.required && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="font-mono text-[10px] text-cream-muted/40 hover:text-cream-muted transition-colors uppercase tracking-widest disabled:opacity-30"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className="border border-cream bg-transparent px-6 py-2.5 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-cream"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Generating
              </span>
            ) : isLastStep ? (
              "Generate Board"
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>

      {/* Context note */}
      <div className="mt-6 border-t border-dark-border pt-4">
        <p className="font-mono text-[10px] text-cream-muted/25 leading-relaxed">
          This brief follows agency-standard structure. The first {requiredCount} fields are required — they give Creative enough context to begin. Optional fields strengthen the brief and reduce rounds of revision.
        </p>
      </div>
    </div>
  );
}
