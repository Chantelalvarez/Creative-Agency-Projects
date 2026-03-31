import mammoth from "mammoth";
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (ext === ".txt") {
      const text = await file.text();
      return NextResponse.json({ text: text.slice(0, 10000) });
    }

    if (ext === ".docx") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value.slice(0, 10000) });
    }

    if (ext === ".pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await pdfParse(buffer);
      return NextResponse.json({ text: result.text.slice(0, 10000) });
    }

    return NextResponse.json({ error: "Unsupported file type. Please upload .pdf, .txt or .docx." }, { status: 400 });
  } catch (error) {
    console.error("Parse file error:", error);
    return NextResponse.json({ error: "Failed to parse file." }, { status: 500 });
  }
}
