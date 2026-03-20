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

const SYSTEM_PROMPT = `You are a senior creative project manager at a leading design agency. Your job is to extract a comprehensive, fully populated creative brief from raw input — meeting transcripts, voice notes, dictated client briefings, or unstructured notes.

EXTRACTION RULES — follow these strictly:
1. Extract anything explicitly stated.
2. Infer anything implied. If the client describes a product category, infer the likely target audience, brand positioning, and competitors even if not mentioned.
3. Fill in reasonable industry-standard assumptions. A premium skincare brand implies a certain aesthetic, audience, and competitive set. Use your agency knowledge to fill gaps.
4. NEVER return an empty string "" unless a field is genuinely impossible to infer from any context. If a transcript has any content at all, every field should have a value.
5. For competitor brands: if none are named, list 2–3 well-known brands in the same category that would be natural competitive references.
6. For colour direction: if none are stated, infer from the brand image, target audience, and category (e.g. clean tech → white, grey, electric blue; luxury beauty → black, gold, nude).
7. For target audience: always include demographics (age, gender), psychographics (values, lifestyle), and a short description of who this person is.
8. For look and feel: be specific — reference real aesthetic movements, photography styles, or brand comparisons the client would understand.
9. If uploaded reference materials are provided, use them to enrich look & feel, colour direction, and brand image fields.

Return ONLY the raw JSON object below — no markdown, no code blocks, no backticks, no explanation. Start your response with { and end with }.

{
  "projectName": "Name of the project or campaign — infer from brand name + deliverable if not stated",
  "clientBackground": "Who the client is, what they do, their industry, company stage, and any relevant context about their business",
  "projectScope": "What creative work is needed — branding, packaging, digital, campaign, product design, or a combination. Be specific.",
  "brandName": "The brand or product name",
  "brandImage": "How the brand should feel and be perceived. Include 4–6 adjectives and a 1–2 sentence description of the brand personality.",
  "targetAudience": "Detailed audience profile: age range, gender, occupation, income level, lifestyle, values, where they shop, what they read. Write as a short paragraph.",
  "competitorBrands": "Comma-separated list of competitor or reference brands. Include any mentioned plus relevant inferred competitors from the same category.",
  "lookAndFeel": "Detailed visual mood and aesthetic direction. Reference real aesthetics, photography styles, design movements, or brand comparisons.",
  "colourDirection": "Specific colours, palettes, or colour moods. If not stated, infer from brand personality and category.",
  "deliverables": "Full list of what needs to be designed or produced. Be specific.",
  "timeline": "Any deadlines, timeframes, or launch dates mentioned. If none stated, write 'Not specified in transcript'.",
  "otherNotes": "Budget constraints, technical requirements, existing assets to retain, things to avoid, stakeholder notes, or any other relevant context."
}`;

/** Strip markdown code fences that Claude sometimes adds despite instructions */
function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
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
    const body = await request.json();
    const { rawInput, inputType, uploadContext } = body as {
      rawInput: string;
      inputType: string;
      uploadContext?: string;
    };

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json({ error: "Input text is required." }, { status: 400 });
    }

    if (rawInput.length > 10000) {
      return NextResponse.json({ error: "Input must be under 10,000 characters." }, { status: 400 });
    }

    const typeLabel = inputType === "dictation" ? "Dictated Notes" : "Meeting Transcript";

    const userContent = uploadContext?.trim()
      ? `${typeLabel}:\n\n${rawInput.trim()}\n\n---\n\nADDITIONAL CONTEXT FROM UPLOADED REFERENCE MATERIALS (use this to enrich your extraction — especially for look & feel, colour direction, and brand image):\n\n${uploadContext.trim()}`
      : `${typeLabel}:\n\n${rawInput.trim()}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
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
