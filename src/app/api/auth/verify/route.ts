import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { encode } from "next-auth/jwt";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.toLowerCase().trim();
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;

  console.log("[verify] called", { email, tokenLength: token?.length });

  if (!token || !email) {
    return NextResponse.redirect(`${loginUrl}?error=invalid`);
  }

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
    console.log("[verify] not in allowlist", { email, ALLOWED_EMAILS });
    return NextResponse.redirect(`${loginUrl}?error=unauthorized`);
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("magic_tokens")
    .select("*")
    .eq("email", email)
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  console.log("[verify] supabase result", { found: !!data, error: error?.message });

  if (error || !data) {
    return NextResponse.redirect(`${loginUrl}?error=expired`);
  }

  await supabase
    .from("magic_tokens")
    .update({ used: true })
    .eq("id", data.id);

  // Create NextAuth JWT session cookie directly
  const sessionToken = await encode({
    token: {
      email,
      sub: email,
      name: email.split("@")[0],
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const response = NextResponse.redirect(`${appUrl}/`);
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
}
