import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface IncomingFile {
  name: string;
  fileType: "image" | "pdf" | "video";
  mediaType?: string;
  data?: string;        // base64 for images and PDFs
  videoFrames?: string[]; // base64 JPEG frames for video
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(request: NextRequest) {
  try {
    const { files }: { files: IncomingFile[] } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ context: "" });
    }

    // Build a single Claude message with all file content blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlocks: any[] = [];
    const fileDescriptions: string[] = [];

    for (const file of files) {
      if (file.fileType === "image" && file.data && file.mediaType) {
        fileDescriptions.push(
          `IMAGE: "${file.name}" — analyse: dominant colours (describe as hex codes where possible), visual style, mood, layout approach, typography style visible, overall aesthetic and brand feel.`
        );
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.mediaType as ImageMediaType,
            data: file.data,
          },
        });
      } else if (file.fileType === "pdf" && file.data) {
        fileDescriptions.push(
          `PDF: "${file.name}" — extract: brand rules, approved colours (with hex codes if stated), font names, logo usage rules, tone of voice guidelines, messaging dos and don'ts, anything that must be carried through creative work.`
        );
        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: file.data,
          },
        });
      } else if (file.fileType === "video" && file.videoFrames && file.videoFrames.length > 0) {
        fileDescriptions.push(
          `VIDEO FRAMES from "${file.name}" (${file.videoFrames.length} key frames) — extract: colour grading and dominant palette, visual motion style, brand energy level (calm/dynamic/bold), overall mood and aesthetic.`
        );
        for (const frame of file.videoFrames) {
          contentBlocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg" as ImageMediaType,
              data: frame,
            },
          });
        }
      }
    }

    if (contentBlocks.length === 0) {
      return NextResponse.json({ context: "" });
    }

    const instructionText = `You are a creative director analysing uploaded brand reference materials. For each file listed below, extract the specified details. Be specific, concrete, and actionable — a designer should be able to use your analysis to inform creative decisions.

Files to analyse:
${fileDescriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Return your analysis as plain text structured like this:

UPLOADED REFERENCE ANALYSIS:

[For each file, write a heading with the file name, then 3–6 bullet points of specific findings]

End with a SHORT SYNTHESIS paragraph (2–3 sentences) combining all uploads into a unified creative direction recommendation.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instructionText },
            ...contentBlocks,
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ context: "" });
    }

    return NextResponse.json({ context: content.text });
  } catch (error) {
    console.error("Analyze uploads error:", error);
    // Non-fatal — return empty context so generation can still proceed
    return NextResponse.json({ context: "" });
  }
}
