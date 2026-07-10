"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Check, Image as ImageIcon, Upload } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getJourneyTaskUploadSignedUrl } from "@/lib/journey/queries";
import type { JourneyScene } from "@/lib/journey/types";
import { PremiumCard } from "./PremiumCard";
import { PrimaryActionButton } from "./PrimaryActionButton";

export function PhotoTaskCard({
  scene,
  isSubmitting,
  onSubmit,
}: {
  scene: JourneyScene;
  isSubmitting: boolean;
  onSubmit: (file: File, rewardKey?: string | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const photoBlock = scene.contentBlocks.find((block) => block.type === "photo_task");
  const rewardKey = getStringMetadata(photoBlock?.metadata, "reward_key") ?? getStringMetadata(photoBlock?.metadata, "rewardKey");
  const hasPrivateStorageImage = Boolean(scene.taskResponse?.storageBucket && scene.taskResponse.storagePath);
  const imageUrl = previewUrl ?? (hasPrivateStorageImage ? signedUrl : scene.taskResponse?.mediaUrl ?? null);
  const isCompleted = scene.progressIsCompleted || scene.taskResponse?.type === "photo";

  useEffect(() => {
    let isMounted = true;

    async function loadSignedUrl() {
      if (!scene.taskResponse?.storageBucket || !scene.taskResponse.storagePath) {
        return;
      }

      try {
        const url = await getJourneyTaskUploadSignedUrl(scene.taskResponse.storageBucket, scene.taskResponse.storagePath);
        if (isMounted) {
          setSignedUrl(url);
        }
      } catch {
        if (isMounted) {
          setImageError("Kaydedilen fotoğraf şu an açılamadı.");
        }
      }
    }

    loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [scene.taskResponse]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
  }

  function submitPhoto() {
    if (!selectedFile) return;
    onSubmit(selectedFile, rewardKey);
  }

  return (
    <PremiumCard className="w-full p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
          {isCompleted ? <Check size={21} strokeWidth={1.8} /> : <Camera size={21} strokeWidth={1.6} />}
        </div>
        {isCompleted ? (
          <div className="rounded-full border border-[#f4dcc0]/18 bg-[#f4dcc0]/10 px-3 py-1 text-xs font-medium text-[#f4dcc0]/88">
            Fotoğraf kaydedildi
          </div>
        ) : null}
      </div>

      <p className="text-2xl font-semibold leading-tight text-[#fffaf2]">
        {photoBlock?.title ?? scene.title}
      </p>
      <p className="mt-4 text-base leading-7 text-[#fffaf2]/68">
        {photoBlock?.body ?? scene.content ?? "Bu anı küçük bir fotoğrafla kaydet."}
      </p>

      <div className="mt-6 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045]">
        {imageUrl ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.975, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.74, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="aspect-[4/5] w-full object-cover" src={imageUrl} alt="Görev fotoğrafı" />
          </motion.div>
        ) : (
          <button
            className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 text-[#f4dcc0]/78"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon size={30} strokeWidth={1.5} />
            <span className="text-sm font-medium">Fotoğraf seç veya çek</span>
          </button>
        )}
      </div>

      {imageError ? <p className="mt-3 text-sm leading-6 text-[#f0b7c6]">{imageError}</p> : null}

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      <div className="mt-6 grid gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-4 text-sm font-medium text-[#fffaf2]/82 backdrop-blur transition hover:bg-white/[0.1] active:translate-y-px"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={17} strokeWidth={1.7} />
          {imageUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Çek"}
        </button>

        <PrimaryActionButton disabled={!selectedFile || isSubmitting} onClick={submitPhoto}>
          {isSubmitting ? "Kaydediliyor" : isCompleted && !selectedFile ? "Kalbime Kaydedildi" : "Fotoğrafı Kaydet"}
          <Upload size={18} strokeWidth={1.7} />
        </PrimaryActionButton>
      </div>
    </PremiumCard>
  );
}

function getStringMetadata(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
