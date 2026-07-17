export type MemoryMatchPair = {
  id: string;
  label: string;
};

export type MemoryMatchConfig = {
  pairs: MemoryMatchPair[];
  backLabel: string;
  matchedLabel: string;
  completionText: string;
};

export type ScratchRevealConfig = {
  revealTitle: string;
  revealText: string;
  imageUrl: string | null;
  imageAlt: string;
  coverLabel: string;
  revealButtonLabel: string;
  completionText: string;
  successThreshold: number;
};

const defaultMemoryPairs: MemoryMatchPair[] = [
  { id: "first-look", label: "İlk Bakış" },
  { id: "favorite-song", label: "Bizim Şarkımız" },
  { id: "best-memory", label: "Güzel Anımız" },
  { id: "next-plan", label: "Yeni Planımız" },
];

export function createDefaultMemoryMatchConfig(): MemoryMatchConfig {
  return {
    pairs: defaultMemoryPairs.map((pair) => ({ ...pair })),
    backLabel: "Kartı aç",
    matchedLabel: "Eşleşti",
    completionText: "Bütün anılar eşleşti. Oyunu tamamladınız.",
  };
}

export function createDefaultScratchRevealConfig(): ScratchRevealConfig {
  return {
    revealTitle: "Küçük Bir Sürpriz",
    revealText: "Bu gecenin en güzel kısmı, onu seninle paylaşmak.",
    imageUrl: null,
    imageAlt: "Kazıma alanının altındaki sürpriz görsel",
    coverLabel: "Sürprizi görmek için alanı kazı",
    revealButtonLabel: "Tek Dokunuşla Aç",
    completionText: "Sürpriz tamamen açıldı.",
    successThreshold: 55,
  };
}

export function readMemoryMatchConfig(value: Record<string, unknown> | null | undefined): MemoryMatchConfig {
  const fallback = createDefaultMemoryMatchConfig();
  const rawPairs = Array.isArray(value?.pairs) ? value.pairs : [];
  const seenIds = new Set<string>();
  const pairs = rawPairs
    .map((item) => (isRecord(item) ? item : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item, index) => ({
      id: readText(item.id, `pair-${index + 1}`),
      label: readText(item.label, `Eşleşme ${index + 1}`),
    }))
    .filter((pair) => {
      const key = pair.id.trim();
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    })
    .slice(0, 8);

  return {
    pairs: pairs.length >= 2 ? pairs : fallback.pairs,
    backLabel: readText(value?.backLabel, fallback.backLabel),
    matchedLabel: readText(value?.matchedLabel, fallback.matchedLabel),
    completionText: readText(value?.completionText, fallback.completionText),
  };
}

export function readScratchRevealConfig(value: Record<string, unknown> | null | undefined): ScratchRevealConfig {
  const fallback = createDefaultScratchRevealConfig();
  const rawThreshold = typeof value?.successThreshold === "number" && Number.isFinite(value.successThreshold)
    ? value.successThreshold
    : fallback.successThreshold;

  return {
    revealTitle: readText(value?.revealTitle, fallback.revealTitle),
    revealText: readText(value?.revealText, fallback.revealText),
    imageUrl: readOptionalText(value?.imageUrl),
    imageAlt: readText(value?.imageAlt, fallback.imageAlt),
    coverLabel: readText(value?.coverLabel, fallback.coverLabel),
    revealButtonLabel: readText(value?.revealButtonLabel, fallback.revealButtonLabel),
    completionText: readText(value?.completionText, fallback.completionText),
    successThreshold: Math.round(Math.min(90, Math.max(20, rawThreshold))),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function readOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
