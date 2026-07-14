"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getEmotionalSoundtrackState,
  setEmotionalSoundtrackMuted,
  startEmotionalSoundtrack,
  subscribeToEmotionalSoundtrack,
} from "@/lib/audio/emotionalSoundtrack";

export function SoundControlButton() {
  const [soundtrack, setSoundtrack] = useState({ started: false, muted: false });

  useEffect(() => {
    const update = () => setSoundtrack(getEmotionalSoundtrackState());
    update();
    return subscribeToEmotionalSoundtrack(update);
  }, []);

  function handleClick() {
    if (!soundtrack.started) {
      startEmotionalSoundtrack();
      return;
    }
    setEmotionalSoundtrackMuted(!soundtrack.muted);
  }

  const label = !soundtrack.started ? "Müziği başlat" : soundtrack.muted ? "Sesi aç" : "Sesi kapat";

  return (
    <button
      className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0a0b17]/55 text-[#f4dcc0]/72 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/[0.09] hover:text-[#f4dcc0] active:translate-y-px"
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {soundtrack.started && soundtrack.muted ? <VolumeX size={18} strokeWidth={1.6} /> : <Volume2 size={18} strokeWidth={1.6} />}
    </button>
  );
}
