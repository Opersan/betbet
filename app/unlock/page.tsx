"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { startEmotionalSoundtrack } from "@/lib/audio/emotionalSoundtrack";
import { DEFAULT_JOURNEY_ACCESS_CODE, validateAccessCode } from "@/lib/journey/queries";
import { JOURNEY_ACCESS_CODE_KEY, JOURNEY_LAST_LOADED_AT_KEY } from "@/hooks/useJourneyScenes";

export default function UnlockPage() {
  const router = useRouter();
  const [code, setCode] = useState(DEFAULT_JOURNEY_ACCESS_CODE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError("Bu küçük yolculuğu açmak için özel kodu girmelisin.");
      return;
    }

    startEmotionalSoundtrack();
    setIsLoading(true);
    setError(null);

    const accessCode = await validateAccessCode(trimmedCode);
    setIsLoading(false);

    if (!accessCode) {
      setError("Bu kod kapıyı açmadı. Bir kez daha sakin sakin deneyelim.");
      return;
    }

    localStorage.setItem(JOURNEY_ACCESS_CODE_KEY, accessCode.code ?? trimmedCode);
    localStorage.setItem(JOURNEY_LAST_LOADED_AT_KEY, new Date().toISOString());

    router.push("/journey");
  }

  return (
    <MobileSceneLayout
      title="20 Temmuz'a Özel"
      subtitle="Bu küçük yolculuk sadece senin için hazırlandı."
      backgroundVariant="rose"
      previousAction={() => router.push("/")}
      progress={{ current: 2, total: 3 }}
    >
      <div className="flex w-full flex-1 items-center">
        <PremiumCard className="w-full p-6">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <LockKeyhole size={21} strokeWidth={1.6} />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#fffaf2]/84" htmlFor="access-code">
                Özel kod
              </label>
              <input
                id="access-code"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Kodu gir"
                className="h-[3.25rem] w-full rounded-[8px] border border-white/12 bg-white/[0.08] px-4 text-base text-[#fffaf2] outline-none backdrop-blur placeholder:text-[#fffaf2]/38 focus:border-[#d9a7a0]/80 focus:ring-2 focus:ring-[#d9a7a0]/20"
              />
              <p className="min-h-5 text-sm leading-5 text-[#f0b7c6]">{error}</p>
            </div>

            <PrimaryActionButton type="submit" disabled={isLoading}>
              {isLoading ? "Açılıyor" : "Yolculuğu Aç"}
              <ArrowRight size={18} strokeWidth={1.7} />
            </PrimaryActionButton>
          </form>
        </PremiumCard>
      </div>
    </MobileSceneLayout>
  );
}
