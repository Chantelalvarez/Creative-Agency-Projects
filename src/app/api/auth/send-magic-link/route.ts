import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const normalised = email?.toLowerCase().trim();

  if (!normalised) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(normalised)) {
    // Return success anyway — don't reveal who's on the allowlist
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  const supabase = createServerClient();

  const { error } = await supabase.from("magic_tokens").insert({
    email: normalised,
    token,
    expires_at: expiresAt,
    used: false,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${appUrl}/verify?token=${token}&email=${encodeURIComponent(normalised)}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: normalised,
    subject: "Your sign-in link — Antareslabs",
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:40px 20px;background:#0a0d12;color:#c8d4e8;">
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#4a5568;margin-bottom:32px;">ANTARESLABS</p>
        <h1 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:12px;">Sign in to AI Mood Board</h1>
        <p style="font-size:13px;color:#7a8fa6;line-height:1.6;margin-bottom:32px;">
          Click the button below to sign in. This link expires in 15 minutes and can only be used once.
        </p>
        <a href="${link}" style="display:inline-block;background:#fff;color:#0a0d12;font-weight:700;font-size:13px;padding:14px 28px;text-decoration:none;letter-spacing:0.05em;">
          Sign in
        </a>
        <p style="font-size:11px;color:#4a5568;margin-top:32px;line-height:1.6;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
