"use client";

import { useState } from "react";

interface StructuredBriefFormProps {
  onComplete: (brief: string) => void;
  isLoading: boolean;
}

const STEPS = [
  {
    id: "project",
    label: "Project / Brand Name",
    placeholder: "e.g. Solara Skincare, Nova Fitness App...",
    question: "What is the project or brand name?",
  },
  {
    id: "audience",
    label: "Target Audience",
    placeholder: "e.g. Millennials aged 25-35, health-conscious professionals...",
    question: "Who is the target audience?",
  },
  {
    id: "goals",
    label: "Project Goals",
    placeholder: "e.g. Launch a new brand identity, redesign packaging, create campaign visuals...",
    question: "What are the project goals and objectives?",
  },
  {
    id: "tone",
    label: "Tone & Mood",
    placeholder: "e.g. Luxury, minimal, warm, bold, playful, sophisticated...",
    question: "What tone and mood should the design convey?",
  },
  {
    id: "visual",
    label: "Visual Preferences",
    placeholder: "e.g. Earth tones, clean typography, organic textures, editorial photography...",
    question: "Any visual preferences or references?",
  },
  {
    id: "requirements",
    label: "Additional Requirements",
    placeholder: "e.g. Must include brand colours #1A1A2E and #E2D1C3, needs to work on dark backgrounds...",
    question: "Any specific requirements or constraints?",
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
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (!currentAnswer.trim() && currentStep < 2) return; // First 3 fields required

    const updated = { ...answers, [step.id]: currentAnswer.trim() };
    setAnswers(updated);

    if (isLastStep) {
      // Compile into a brief
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const compileBrief = (data: Record<string, string>): string => {
    const parts: string[] = [];
    if (data.project) parts.push(`Project: ${data.project}.`);
    if (data.audience) parts.push(`Target audience: ${data.audience}.`);
    if (data.goals) parts.push(`Goals: ${data.goals}.`);
    if (data.tone) parts.push(`Desired tone and mood: ${data.tone}.`);
    if (data.visual) parts.push(`Visual direction: ${data.visual}.`);
    if (data.requirements) parts.push(`Requirements: ${data.requirements}.`);
    return parts.join(" ");
  };

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="font-mono text-[10px] text-cream-muted/50">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-px bg-dark-border w-full">
          <div
            className="h-px bg-cream transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <label className="block font-sans text-sm font-semibold text-cream mb-1">
          {step.question}
        </label>
        <span className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest">
          {step.label}
        </span>
      </div>

      {/* Input */}
      <textarea
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={step.placeholder}
        rows={3}
        className="w-full resize-none rounded-none border border-dark-border bg-dark-surface px-4 py-3 font-mono text-sm text-cream placeholder:text-cream-muted/40 focus:border-cream-muted focus:outline-none transition-colors mb-4"
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
          {currentStep >= 2 && !isLastStep && (
            <button
              type="button"
              onClick={() => setCurrentAnswer("")}
              className="font-mono text-[10px] text-cream-muted/40 hover:text-cream-muted transition-colors uppercase tracking-widest"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={(!currentAnswer.trim() && currentStep < 2) || isLoading}
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
    </div>
  );
}
