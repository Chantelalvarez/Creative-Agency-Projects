import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { StructuredBrief } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a world-class creative director at a leading design agency. Given a structured creative brief, generate exactly 3 DISTINCT mood board routes (A, B, C). Each route must explore a genuinely different creative territory — different mood, colour story, aesthetic, and visual language. They should not be minor variations of each other.

Return ONLY valid JSON — no markdown, no explanation, no backticks:

{
  "routes": [
    {
      "name": "Route A",
      "direction": "One sentence capturing this route's core creative territory",
      "colorPalette": [
        { "hex": "#hexcode", "name": "Descriptive Color Name" }
      ],
      "moodKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
      "typographyDirection": {
        "headingStyle": "Specific heading typography description",
        "bodyStyle": "Specific body typography description",
        "notes": "Additional typography guidance"
      },
      "visualSearchTerms": ["specific term 1", "specific term 2", "specific term 3", "specific term 4", "specific term 5"],
      "creativeDirections": ["Direction statement 1", "Direction statement 2", "Direction statement 3"]
    }
  ]
}

Rules:
- Exactly 3 routes named "Route A", "Route B", "Route C"
- colorPalette: exactly 5 colours per route with hex codes and descriptive names
- moodKeywords: 6-8 evocative words or short phrases per route
- visualSearchTerms: 5 specific terms optimised for Unsplash photo search — be descriptive to get relevant results
- creativeDirections: 3 concise actionable statements per route
- Each route MUST be genuinely distinct in mood, colour story, and aesthetic approach`;

export async function POST(request: NextRequest) {
  try {
    const { brief }: { brief: StructuredBrief } = await request.json();

    if (!brief || typeof brief !== "object") {
      return NextResponse.json({ error: "A structured brief is required." }, { status: 400 });
    }

    const briefText = Object.entries(brief)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    if (!briefText.trim()) {
      return NextResponse.json({ error: "Brief has no content." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Creative Brief:\n\n${briefText}` }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format." }, { status: 500 });
    }

    const { routes } = JSON.parse(content.text);

    if (!routes || !Array.isArray(routes) || routes.length !== 3) {
      return NextResponse.json({ error: "Invalid mood board data structure." }, { status: 500 });
    }

    return NextResponse.json({ routes });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Failed to generate mood boards. Please try again." }, { status: 500 });
  }
}
