"use client";

import { RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { uploadJourneyContentFile } from "@/lib/content-studio/storage";
import {
  defaultImagePlacement,
  readImagePlacement,
  writeImagePlacement,
  type ImagePlacement,
} from "@/lib/media/image-placement";

export function MediaUploadField({
  sceneSlug,
  label,
  value,
  onChange,
  enableImagePlacement = false,
}: {
  sceneSlug: string;
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  enableImagePlacement?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { src, placement } = readImagePlacement(value);

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
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={enableImagePlacement ? "image/*" : undefined}
        onChange={(event) => upload(event.target.files?.[0] ?? null)}
      />
      <input
        className="w-full rounded-[8px] border border-white/10 bg-[#080a16] px-3 py-2 text-sm text-[#fffaf2]/86 outline-none focus:border-[#f4dcc0]/38"
        value={src}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
      />
      {enableImagePlacement && src ? (
        <ImagePlacementEditor
          src={src}
          placement={placement}
          onChange={(nextPlacement) => onChange(writeImagePlacement(src, nextPlacement))}
        />
      ) : null}
      {src ? (
        <a className="mt-2 block truncate text-xs text-[#f4dcc0]/74" href={src} target="_blank" rel="noreferrer">
          Önizlemeyi aç
        </a>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[#f0b7c6]">{error}</p> : null}
    </div>
  );
}

function ImagePlacementEditor({
  src,
  placement,
  onChange,
}: {
  src: string;
  placement: ImagePlacement;
  onChange: (placement: ImagePlacement) => void;
}) {
  function update(key: "x" | "y" | "zoom", rawValue: string) {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return;
    onChange({ ...placement, [key]: nextValue });
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="grid grid-cols-[112px_1fr] gap-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] border border-white/10 bg-[#050711]">
          <PositionedImage
            value={writeImagePlacement(src, placement)}
            alt="Görsel yerleşimi önizlemesi"
          />
        </div>
        <div className="grid content-start grid-cols-3 gap-2">
          <label className="col-span-3">
            <span className="mb-1 block text-[10px] font-semibold text-[#f4dcc0]/66">Görünüm</span>
            <select
              className="studio-input px-2 py-1.5 text-xs"
              value={placement.mode}
              onChange={(event) => onChange({ ...placement, mode: event.target.value === "contain" ? "contain" : "cover" })}
            >
              <option value="cover">Kadrajı doldur</option>
              <option value="contain">Fotoğrafın tamamını sığdır</option>
            </select>
          </label>
          <PlacementNumberField label="X" value={placement.x} min={-50} max={50} onChange={(value) => update("x", value)} />
          <PlacementNumberField label="Y" value={placement.y} min={-50} max={50} onChange={(value) => update("y", value)} />
          <PlacementNumberField label="Zoom (%)" value={placement.zoom} min={100} max={250} onChange={(value) => update("zoom", value)} />
          <p className="col-span-3 text-[11px] leading-4 text-[#fffaf2]/48">
            Sığdır seçeneği yatay fotoğrafın tamamını gösterir; kalan alan aynı fotoğrafın bulanık kopyasıyla doldurulur. +X sağ, +Y alt tarafı odaklar.
          </p>
          <button
            className="studio-mini-button col-span-3 justify-self-start"
            type="button"
            onClick={() => onChange(defaultImagePlacement)}
          >
            <RotateCcw size={13} strokeWidth={1.7} /> Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}

function PlacementNumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold text-[#f4dcc0]/66">{label}</span>
      <input
        className="studio-input px-2 py-1.5 text-xs"
        type="number"
        step="1"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
