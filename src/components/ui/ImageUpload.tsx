"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  slug: string;
  folder: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  className?: string;
  size?: "sm" | "lg";
  shape?: "square" | "circle";
  label?: string;
}

export function ImageUpload({
  slug,
  folder,
  currentUrl,
  onUpload,
  className = "",
  size = "lg",
  shape = "square",
  label = "Subir imagen",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentUrl;
  const sizeClasses = size === "sm" ? "h-20 w-20" : "h-32 w-32";
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Máx. 5MB");
      return;
    }

    setError("");
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch(`/api/${slug}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpload(data.url);
      } else {
        const data = await res.json();
        setError(data.error || "Error al subir");
        setPreview(null);
      }
    } catch {
      setError("Error de conexión");
      setPreview(null);
    }

    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative ${sizeClasses} ${shapeClass} border-2 border-dashed border-[#e8e6e1] hover:border-[#b49a5a] cursor-pointer transition-colors overflow-hidden group ${
          displayUrl ? "border-solid border-[#e8e6e1]" : ""
        }`}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt=""
              className={`h-full w-full object-cover ${shapeClass}`}
            />
            <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${shapeClass}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-[#bbb] group-hover:text-[#b49a5a] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[10px] font-medium">{label}</span>
          </div>
        )}

        {uploading && (
          <div className={`absolute inset-0 bg-white/80 flex items-center justify-center ${shapeClass}`}>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
