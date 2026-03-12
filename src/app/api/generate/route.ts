import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { MoodBoardData } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a world-class creative director and visual designer. When given a creative brief, you generate comprehensive mood board directions.

You MUST respond with valid JSON only — no markdown, no explanation, no backticks. Return exactly this structure:

{
  "colorPalette": [
    { "hex": "#hexcode", "name": "Color Name" }
  ],
  "moodKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "typographyDirection": {
    "headingStyle": "Description of heading typography style",
    "bodyStyle": "Description of body typography style",
    "notes": "Additional typography guidance"
  },
  "visualSearchTerms": ["search term 1", "search term 2", "search term 3", "search term 4", "search term 5", "search term 6"],
  "creativeDirections": ["Direction 1 - a short sentence", "Direction 2 - a short sentence", "Direction 3 - a short sentence"]
}

Rules:
- colorPalette: exactly 6 colours with hex codes and descriptive names
- moodKeywords: 6-8 evocative single words or short phrases
- typographyDirection: specific, actionable typography guidance
- visualSearchTerms: 6 specific terms optimised for stock photo search (Unsplash). Be specific and descriptive to get relevant results.
- creativeDirections: 3 concise creative direction statements`;

export async function POST(request: NextRequest) {
  try {
    const { brief } = await request.json();

    if (!brief || typeof brief !== "string" || brief.trim().length === 0) {
      return NextResponse.json(
        { error: "A creative brief is required." },
        { status: 400 }
      );
    }

    if (brief.length > 2000) {
      return NextResponse.json(
        { error: "Brief must be under 2000 characters." },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Creative Brief: ${brief.trim()}`,
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

    const data: MoodBoardData = JSON.parse(content.text);

    // Validate structure
    if (
      !data.colorPalette ||
      !data.moodKeywords ||
      !data.typographyDirection ||
      !data.visualSearchTerms ||
      !data.creativeDirections
    ) {
      return NextResponse.json(
        { error: "Invalid mood board data structure." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate mood board. Please try again." },
      { status: 500 }
    );
  }
}
