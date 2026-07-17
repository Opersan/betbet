"use client";

import { useCallback, useEffect, useRef } from "react";
import { SCENE_NAVIGATION_GUARD_MS } from "@/lib/journey/scene-reveal";

export function useSceneNavigationGuard() {
  const isGuardedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback((navigate: () => void) => {
    if (isGuardedRef.current) {
      return false;
    }

    isGuardedRef.current = true;
    navigate();
    timerRef.current = window.setTimeout(() => {
      isGuardedRef.current = false;
      timerRef.current = null;
    }, SCENE_NAVIGATION_GUARD_MS);
    return true;
  }, []);
}
