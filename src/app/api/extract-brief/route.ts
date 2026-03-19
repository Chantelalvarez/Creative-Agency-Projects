import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { StructuredBrief } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BRIEF_FIELDS: (keyof StructuredBrief)[] = [
  "projectName",
  "clientBackground",
  "projectScope",
  "brandName",
  "brandImage",
  "targetAudience",
  "competitorBrands",
  "lookAndFeel",
  "colourDirection",
  "deliverables",
  "timeline",
  "otherNotes",
];

const SYSTEM_PROMPT = `You are a creative project manager at a design agency. Your job is to extract a structured creative brief from raw input such as meeting transcripts, voice notes, or unstructured text.

Extract every piece of relevant information you can find and return it as a JSON object. Be generous in your extraction — if something is implied or can be reasonably inferred, include it. Only use an empty string "" if a field genuinely has no relevant information in the input.

Return ONLY the raw JSON object below — no markdown, no code blocks, no backticks, no explanation. Start your response with { and end with }.

{
  "projectName": "name of the project or campaign",
  "clientBackground": "who the client is, what they do, their industry",
  "projectScope": "branding, packaging, product design, or combination",
  "brandName": "the brand or product name",
  "brandImage": "how the brand should feel or be perceived, e.g. high-end, natural, minimal, playful, premium",
  "targetAudience": "age range, gender, occupation, lifestyle, psychographics",
  "competitorBrands": "competitor brands, reference brands, or inspiration brands mentioned",
  "lookAndFeel": "visual mood, tone, aesthetic direction, visual references or comparisons",
  "colourDirection": "specific colours, colour palettes, or colour moods mentioned",
  "deliverables": "what needs to be designed or produced",
  "timeline": "deadlines, timeframes, or launch dates",
  "otherNotes": "any other relevant project details, constraints, or context"
}`;

/** Strip markdown code fences that Claude sometimes adds despite instructions */
function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Grab the first {...} block if there is leading/trailing prose
  const block = trimmed.match(/(\{[\s\S]*\})/);
  if (block) return block[1].trim();
  return trimmed;
}

/** Ensure every StructuredBrief key is present and a string */
function normaliseBrief(parsed: Record<string, unknown>): StructuredBrief {
  return Object.fromEntries(
    BRIEF_FIELDS.map((key) => [
      key,
      typeof parsed[key] === "string" ? (parsed[key] as string) : "",
    ])
  ) as unknown as StructuredBrief;
}

export async function POST(request: NextRequest) {
  try {
    const { rawInput, inputType } = await request.json();

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json({ error: "Input text is required." }, { status: 400 });
    }

    if (rawInput.length > 10000) {
      return NextResponse.json({ error: "Input must be under 10,000 characters." }, { status: 400 });
    }

    const typeLabel = inputType === "dictation" ? "Dictated Notes" : "Meeting Transcript";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${typeLabel}:\n\n${rawInput.trim()}` }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format." }, { status: 500 });
    }

    const jsonText = extractJSON(content.text);
    const parsed = JSON.parse(jsonText);
    const brief = normaliseBrief(parsed);

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Extract brief error:", error);
    return NextResponse.json(
      { error: "Failed to extract brief. Please try again." },
      { status: 500 }
    );
  }
}
