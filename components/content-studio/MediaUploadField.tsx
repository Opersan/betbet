"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { uploadJourneyContentFile } from "@/lib/content-studio/storage";

export function MediaUploadField({
  sceneSlug,
  label,
  value,
  onChange,
}: {
  sceneSlug: string;
  label: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadJourneyContentFile(sceneSlug, file);
      onChange(result.publicUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload başarısız.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f4dcc0]/72">{label}</p>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 px-3 py-1.5 text-xs font-medium text-[#f4dcc0] hover:bg-[#f4dcc0]/15"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={14} strokeWidth={1.7} />
          {isUploading ? "Yükleniyor" : "Dosya Yükle"}
        </button>
      </div>
      <input ref={inputRef} className="hidden" type="file" onChange={(event) => upload(event.target.files?.[0] ?? null)} />
      <input
        className="w-full rounded-[8px] border border-white/10 bg-[#080a16] px-3 py-2 text-sm text-[#fffaf2]/86 outline-none focus:border-[#f4dcc0]/38"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
      />
      {value ? (
        <a className="mt-2 block truncate text-xs text-[#f4dcc0]/74" href={value} target="_blank" rel="noreferrer">
          Önizlemeyi aç
        </a>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[#f0b7c6]">{error}</p> : null}
    </div>
  );
}
