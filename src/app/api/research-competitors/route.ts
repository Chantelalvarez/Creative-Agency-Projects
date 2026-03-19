import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CompetitorAnalysis, StructuredBrief } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior brand strategist at a top creative agency. Research competitor brands using web search and produce a structured competitive analysis.

Be specific and accurate. Use current information where available. Return ONLY valid JSON — no markdown, no code blocks, no preamble. Start with { and end with }.`;

function extractJSON(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const block = trimmed.match(/(\{[\s\S]*\})/);
  if (block) return block[1].trim();
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const { competitors, brief }: { competitors: string[]; brief?: StructuredBrief } =
      await request.json();

    const competitorList = (competitors ?? [])
      .map((c) => c?.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (competitorList.length === 0) {
      return NextResponse.json({
        analysis: { competitors: [], marketOpportunity: "" },
      });
    }

    const briefContext = [
      brief?.clientBackground && `Client: ${brief.clientBackground}`,
      brief?.brandName && `Brand being developed: ${brief.brandName}`,
      brief?.projectScope && `Project scope: ${brief.projectScope}`,
      brief?.targetAudience && `Target audience: ${brief.targetAudience}`,
      brief?.brandImage && `Desired brand image: ${brief.brandImage}`,
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = `Research these competitor brands and return a competitive analysis: ${competitorList.join(", ")}

${briefContext ? `Context about the brand being developed:\n${briefContext}\n` : ""}
For each competitor provide:
- A brief brand overview (1–2 sentences)
- Their visual style / aesthetic direction
- Their target audience
- Their price positioning (choose one: budget / mid / premium / luxury)
- 2–3 key strengths as a short paragraph
- 2–3 weaknesses or gaps in their offer as a short paragraph

Also write a "marketOpportunity" paragraph (2–3 sentences) identifying where the client brand can own a unique position in this competitive landscape.

Return this exact JSON structure:
{
  "competitors": [
    {
      "name": "Brand Name",
      "overview": "What the brand is and does",
      "visualStyle": "Their visual aesthetic",
      "targetAudience": "Who they target",
      "pricePositioning": "budget | mid | premium | luxury",
      "strengths": "Key strengths as a paragraph",
      "weaknesses": "Weaknesses and gaps as a paragraph"
    }
  ],
  "marketOpportunity": "Where the client brand can find a unique position"
}`;

    // Try with web search tool first
    let message: Anthropic.Message;
    try {
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305", name: "web_search" }] as any,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch {
      // Fall back to Claude's training knowledge if web search isn't available
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
    }

    // Handle tool_use loop (web_search may require multiple turns)
    const allMessages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];

    let currentMessage = message;
    let iterations = 0;

    while (currentMessage.stop_reason === "tool_use" && iterations < 5) {
      iterations++;
      allMessages.push({ role: "assistant", content: currentMessage.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = currentMessage.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search executed.",
        }));

      allMessages.push({ role: "user", content: toolResults });

      currentMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305", name: "web_search" }] as any,
        system: SYSTEM_PROMPT,
        messages: allMessages,
      });
    }

    const text = currentMessage.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    if (!text) {
      throw new Error("No text response from AI.");
    }

    const jsonText = extractJSON(text);
    const analysis: CompetitorAnalysis = JSON.parse(jsonText);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Competitor research error:", error);
    return NextResponse.json(
      { error: "Failed to research competitors." },
      { status: 500 }
    );
  }
}
