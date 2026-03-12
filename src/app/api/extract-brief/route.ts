import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a creative project manager at a design agency. You extract structured creative briefs from raw meeting notes, transcripts, or dictated notes.

Given raw input (meeting transcript, voice notes, or unstructured text), extract and return a clean, structured creative brief as a single paragraph of text (NOT JSON). The brief should be 150-400 words and include:

- Project/brand name (if mentioned)
- Target audience
- Project goals and objectives
- Desired tone and mood
- Key visual preferences or constraints
- Any specific requirements mentioned

Write it as a cohesive creative brief paragraph that a designer could use to create a mood board. If information is missing, focus on what IS available and make reasonable inferences based on context.

Return ONLY the brief text — no labels, no headers, no markdown formatting.`;

export async function POST(request: NextRequest) {
  try {
    const { rawInput, inputType } = await request.json();

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: "Input text is required." },
        { status: 400 }
      );
    }

    if (rawInput.length > 10000) {
      return NextResponse.json(
        { error: "Input must be under 10,000 characters." },
        { status: 400 }
      );
    }

    const typeLabel = inputType === "transcript" ? "Meeting Transcript" : "Dictated Notes";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${typeLabel}:\n\n${rawInput.trim()}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from AI." },
        { status: 500 }
      );
    }

    return NextResponse.json({ brief: content.text.trim() });
  } catch (error) {
    console.error("Extract brief API error:", error);
    return NextResponse.json(
      { error: "Failed to extract brief. Please try again." },
      { status: 500 }
    );
  }
}
