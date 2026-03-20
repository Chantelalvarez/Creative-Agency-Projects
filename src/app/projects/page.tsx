"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

interface ProjectSummary {
  id: string;
  project_name: string;
  client_name: string | null;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(({ projects: p, error: e }) => {
        if (e) setError(e);
        else setProjects(p ?? []);
      })
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) return;
    const { project } = await res.json();
    // Compress and pass to home page via share route
    const { default: LZString } = await import("lz-string");
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify(project.data)
    );
    router.push(`/share?d=${compressed}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-6 pt-28 pb-20">
        {/* Page header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest mb-2">
              Saved work
            </p>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-cream">
              My Projects
            </h1>
          </div>
          <Link
            href="/"
            className="border border-cream px-6 py-2.5 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
          >
            + New Package
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-3 py-20">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border border-cream/30 border-t-cream" />
            <span className="font-mono text-xs text-cream-muted/50">Loading projects…</span>
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-500/30 bg-red-500/5 p-6">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-1 w-8 bg-dark-border mb-8" />
            <p className="font-sans text-lg font-semibold text-cream mb-2">
              No saved projects yet
            </p>
            <p className="font-mono text-xs text-cream-muted/50 mb-8 max-w-xs leading-relaxed">
              Generate your first creative package and save it to your account.
            </p>
            <Link
              href="/"
              className="border border-cream px-8 py-3 font-sans text-xs font-semibold tracking-[0.2em] text-cream uppercase transition-all hover:bg-cream hover:text-dark"
            >
              Generate Package →
            </Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleOpen(project.id)}
                className="group relative border border-dark-border bg-dark-surface p-6 text-left transition-all hover:border-cream-muted/40 hover:bg-cream/[0.02]"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  disabled={deleting === project.id}
                  className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center text-cream-muted/20 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all disabled:opacity-30"
                >
                  {deleting === project.id ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M9 3L3 9M3 3L9 9"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>

                <p className="font-mono text-[10px] text-cream-muted/40 uppercase tracking-widest mb-3">
                  {formatDate(project.created_at)}
                </p>
                <p className="font-sans text-base font-bold text-cream leading-tight mb-1 pr-6">
                  {project.project_name}
                </p>
                {project.client_name && (
                  <p className="font-mono text-xs text-cream-muted/60">
                    {project.client_name}
                  </p>
                )}

                <div className="mt-6 flex items-center gap-1.5 font-mono text-[10px] text-cream-muted/30 uppercase tracking-widest group-hover:text-cream-muted/60 transition-colors">
                  <span>Open</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
