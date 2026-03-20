"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { UploadedFile } from "@/lib/types";

const MAX_FILES = 5;
const ACCEPTED_TYPES: Record<string, "image" | "pdf" | "video"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
};

// Extract N evenly-spaced frames from a video file (client-side, no ffmpeg)
async function extractVideoFrames(file: File, numFrames = 5): Promise<{ frames: string[]; firstFrameUrl: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = async () => {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth || 1, video.videoHeight || 1));
      canvas.width = Math.floor((video.videoWidth || 640) * scale);
      canvas.height = Math.floor((video.videoHeight || 360) * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error("Canvas unavailable")); return; }

      const duration = video.duration;
      const timestamps = Array.from({ length: numFrames }, (_, i) =>
        (duration * (i + 1)) / (numFrames + 1)
      );

      const frames: string[] = [];
      for (const ts of timestamps) {
        await new Promise<void>((res) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL("image/jpeg", 0.75).split(",")[1]);
            res();
          };
          video.currentTime = ts;
        });
      }

      URL.revokeObjectURL(objectUrl);
      const firstFrameUrl = `data:image/jpeg;base64,${frames[0]}`;
      resolve({ frames, firstFrameUrl });
    };

    video.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load video")); };
    video.src = objectUrl;
  });
}

interface ContextUploaderProps {
  onChange: (files: UploadedFile[]) => void;
}

export default function ContextUploader({ onChange }: ContextUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent whenever files change
  useEffect(() => {
    onChange(files);
  }, [files, onChange]);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(f.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFiles = useCallback(async (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) return;

    const toProcess = arr.slice(0, remaining);

    for (const file of toProcess) {
      const fileType = ACCEPTED_TYPES[file.type];
      if (!fileType) continue;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (fileType === "video") {
        // Add placeholder while processing
        const placeholder: UploadedFile = { id, name: file.name, fileType: "video", file, isProcessing: true };
        setFiles((prev) => [...prev, placeholder]);

        try {
          const { frames, firstFrameUrl } = await extractVideoFrames(file);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, isProcessing: false, previewUrl: firstFrameUrl, videoFrames: frames }
                : f
            )
          );
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, isProcessing: false, error: "Failed to extract frames" } : f
            )
          );
        }
      } else if (fileType === "image") {
        const previewUrl = URL.createObjectURL(file);
        setFiles((prev) => [...prev, { id, name: file.name, fileType: "image", file, previewUrl, isProcessing: false }]);
      } else {
        // PDF
        setFiles((prev) => [...prev, { id, name: file.name, fileType: "pdf", file, isProcessing: false }]);
      }
    }
  }, [files.length]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id);
      if (f?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const hasRoom = files.length < MAX_FILES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-xs font-semibold tracking-[0.2em] text-cream-muted uppercase">
            Additional Context
          </p>
          <p className="font-mono text-[10px] text-cream-muted/40 mt-0.5">
            Optional — brand guidelines, reference images, or inspiration
          </p>
        </div>
        <span className="font-mono text-[10px] text-cream-muted/30 uppercase tracking-widest">
          {files.length}/{MAX_FILES}
        </span>
      </div>

      {/* Drop zone */}
      {hasRoom && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 cursor-pointer transition-all ${
            isDragging
              ? "border-cream/60 bg-cream/5"
              : "border-dark-border hover:border-cream-muted/40 hover:bg-cream/[0.02]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-cream-muted/30">
            <path d="M10 2V13M10 2L7 5M10 2L13 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 14V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="font-mono text-[11px] text-cream-muted/50 text-center">
            Drop files here or click to upload
          </p>
          <p className="font-mono text-[10px] text-cream-muted/30 text-center">
            JPG · PNG · WEBP · PDF · MP4 · MOV
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.mov,.webm"
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f) => (
            <div key={f.id} className="relative group border border-dark-border bg-dark-surface">
              {f.fileType === "image" && f.previewUrl ? (
                // Image thumbnail
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover" />
                </div>
              ) : f.fileType === "video" ? (
                // Video — first frame or spinner
                <div className="aspect-video overflow-hidden bg-dark flex items-center justify-center">
                  {f.isProcessing ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border border-cream/30 border-t-cream" />
                  ) : f.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cream-muted/30">
                      <path d="M5 4L19 12L5 20V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  )}
                  {/* Video badge */}
                  <span className="absolute bottom-1 left-1 font-mono text-[8px] bg-dark/80 text-cream-muted/60 px-1 py-0.5 uppercase tracking-widest">
                    {f.isProcessing ? "Processing…" : "Video"}
                  </span>
                </div>
              ) : (
                // PDF icon
                <div className="aspect-video flex flex-col items-center justify-center gap-1.5 bg-dark px-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cream-muted/40 shrink-0">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-[9px] text-cream-muted/40 text-center truncate w-full px-1">PDF</span>
                </div>
              )}

              {/* File name */}
              <div className="px-2 py-1.5 border-t border-dark-border">
                <p className="font-mono text-[9px] text-cream-muted/50 truncate leading-tight">
                  {f.name}
                </p>
                {f.error && <p className="font-mono text-[9px] text-red-400 truncate">{f.error}</p>}
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-dark/80 text-cream-muted/60 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cream hover:bg-dark"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M6 2L2 6M2 2L6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
