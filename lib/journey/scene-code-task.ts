import type { JourneyContentBlock } from "@/lib/journey/types";

export type SceneCodeTaskConfig = {
  answer: string | null;
  hints: string[];
  inputLabel: string;
  placeholder: string;
  submitLabel: string;
  successText: string;
};

export type SceneCodeTaskDefinition = {
  title: string | null;
  body: string | null;
  config: SceneCodeTaskConfig;
};

const DEFAULT_CONFIG = {
  inputLabel: "Bulduğun kod",
  placeholder: "Kodu yaz",
  submitLabel: "Kodu Doğrula",
  successText: "Doğru kod. Sonraki ipucuna geçiyoruz.",
} satisfies Omit<SceneCodeTaskConfig, "answer" | "hints">;

const TURKISH_ASCII_MAP: Record<string, string> = {
  Ç: "C",
  Ğ: "G",
  İ: "I",
  Ö: "O",
  Ş: "S",
  Ü: "U",
};

export function findSceneCodeTask(blocks: JourneyContentBlock[]): SceneCodeTaskDefinition | null {
  const block = blocks.find(
    (candidate) => candidate.type === "prompt" && candidate.metadata.mode === "scene_code",
  );

  if (!block) {
    return null;
  }

  return {
    title: readOptionalString(block.title),
    body: readOptionalString(block.body),
    config: {
      answer: readOptionalString(block.metadata.answer),
      hints: readStringArray(block.metadata.hints),
      inputLabel: readString(block.metadata.inputLabel, DEFAULT_CONFIG.inputLabel),
      placeholder: readString(block.metadata.placeholder, DEFAULT_CONFIG.placeholder),
      submitLabel: readString(block.metadata.submitLabel, DEFAULT_CONFIG.submitLabel),
      successText: readString(block.metadata.successText, DEFAULT_CONFIG.successText),
    },
  };
}

export function normalizeSceneCode(value: string) {
  return value
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/[ÇĞİÖŞÜ]/g, (character) => TURKISH_ASCII_MAP[character] ?? character)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function readOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readString(value: unknown, fallback: string) {
  return readOptionalString(value) ?? fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalized = readOptionalString(item);
    return normalized ? [normalized] : [];
  });
}
