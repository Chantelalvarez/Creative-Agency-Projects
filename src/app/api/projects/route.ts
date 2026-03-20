import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

// GET /api/projects — list all projects for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, project_name, client_name, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Supabase list error:", error);
    return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

// POST /api/projects — save a new project
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { projectName, clientName, data } = body as {
    projectName: string;
    clientName?: string;
    data: unknown;
  };

  if (!projectName || !data) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({
      user_id: session.user.id,
      project_name: projectName,
      client_name: clientName ?? null,
      data,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save project." }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id });
}
