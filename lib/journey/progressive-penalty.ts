export type ProgressivePenaltyRound = {
  id: string;
  title: string;
  kind: string;
  penalty: string;
};

export type ProgressivePenaltyConfig = {
  version: 1;
  players: [string, string];
  rounds: ProgressivePenaltyRound[];
  balanceMode: "strict";
  allowReroll: false;
  revealLabel: string;
  confirmLabel: string;
  completeLabel: string;
  finalText: string;
};

export type ProgressivePenaltyRoundResult = ProgressivePenaltyRound & {
  winner: string;
  loser: string;
};

export type ProgressivePenaltyResult = {
  gameType: "progressive_penalty";
  mode: "same_phone_progressive_penalty";
  version: 1;
  status: "completed";
  players: [string, string];
  completedRounds: number;
  rounds: ProgressivePenaltyRoundResult[];
  lossCounts: Record<string, number>;
  lastRound: ProgressivePenaltyRoundResult;
  winner: string;
  loser: string;
  penalty: string;
  completedAt: string;
};

export function validateProgressivePenaltyConfig(value: unknown): {
  config: ProgressivePenaltyConfig | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { config: null, errors: ["Config geçerli bir JSON nesnesi olmalı."] };
  }

  if (value.version !== 1) errors.push("version değeri 1 olmalı.");

  const players = value.players;
  if (!Array.isArray(players) || players.length !== 2) {
    errors.push("players tam olarak iki oyuncu içermeli.");
  } else {
    if (players.some((player) => !isNonEmptyString(player))) {
      errors.push("Her oyuncunun adı boş olmayan bir metin olmalı.");
    }
    if (players.every(isNonEmptyString) && players[0].trim() === players[1].trim()) {
      errors.push("Oyuncu adları birbirinden farklı olmalı.");
    }
  }

  if (value.balanceMode !== "strict") errors.push("balanceMode yalnızca strict olabilir.");
  if (value.allowReroll !== false) errors.push("allowReroll false olmalı; bu oyunda yeniden seçim yoktur.");
  if (!isNonEmptyString(value.revealLabel)) errors.push("revealLabel boş olmayan bir metin olmalı.");
  if (!isNonEmptyString(value.confirmLabel)) errors.push("confirmLabel boş olmayan bir metin olmalı.");
  if (!isNonEmptyString(value.completeLabel)) errors.push("completeLabel boş olmayan bir metin olmalı.");
  if (!isNonEmptyString(value.finalText)) errors.push("finalText boş olmayan bir metin olmalı.");

  const rounds = value.rounds;
  if (!Array.isArray(rounds) || rounds.length === 0) {
    errors.push("En az bir tur tanımlanmalı.");
  } else {
    const ids = new Set<string>();
    rounds.forEach((round, index) => {
      if (!isRecord(round)) {
        errors.push(`${index + 1}. tur geçerli bir nesne olmalı.`);
        return;
      }
      if (!isNonEmptyString(round.id)) {
        errors.push(`${index + 1}. tur için id zorunlu.`);
      } else if (ids.has(round.id.trim())) {
        errors.push(`Tur id değeri benzersiz olmalı: ${round.id.trim()}`);
      } else {
        ids.add(round.id.trim());
      }
      if (!isNonEmptyString(round.title)) errors.push(`${index + 1}. tur için title zorunlu.`);
      if (!isNonEmptyString(round.kind)) errors.push(`${index + 1}. tur için kind zorunlu.`);
      if (!isNonEmptyString(round.penalty)) errors.push(`${index + 1}. tur için penalty zorunlu.`);
    });
  }

  return {
    config: errors.length === 0 ? (value as unknown as ProgressivePenaltyConfig) : null,
    errors,
  };
}

export function createProgressivePenaltyPlan(roundCount: number): Array<0 | 1> {
  const firstCount = Math.floor(roundCount / 2) + (roundCount % 2 === 1 && Math.random() < 0.5 ? 1 : 0);
  const plan: Array<0 | 1> = Array.from({ length: roundCount }, (_, index) => (index < firstCount ? 0 : 1));
  for (let index = plan.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [plan[index], plan[target]] = [plan[target], plan[index]];
  }
  return plan;
}

export function getProgressivePenaltyFingerprint(config: ProgressivePenaltyConfig): string {
  const source = stableStringify(config);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createDefaultProgressivePenaltyConfig(): ProgressivePenaltyConfig {
  return {
    version: 1,
    players: ["Oyuncu 1", "Oyuncu 2"],
    rounds: [
      {
        id: "round-1",
        title: "1. Tur",
        kind: "penalty",
        penalty: "Bu turun cezasını buraya yazın.",
      },
    ],
    balanceMode: "strict",
    allowReroll: false,
    revealLabel: "Kartları Aç",
    confirmLabel: "Cezayı Tamamladık",
    completeLabel: "Oyunu Tamamla",
    finalText: "Tüm turlar tamamlandı.",
  };
}

export function parseProgressivePenaltyResult(value: unknown): ProgressivePenaltyResult | null {
  if (
    !isRecord(value) ||
    value.gameType !== "progressive_penalty" ||
    value.mode !== "same_phone_progressive_penalty" ||
    value.version !== 1 ||
    value.status !== "completed"
  ) return null;
  if (!Array.isArray(value.players) || value.players.length !== 2 || !value.players.every(isNonEmptyString)) return null;
  if (!Array.isArray(value.rounds) || value.rounds.length === 0) return null;
  const rounds: ProgressivePenaltyRoundResult[] = [];
  for (const round of value.rounds) {
    if (
      !isRecord(round) ||
      !isNonEmptyString(round.id) ||
      !isNonEmptyString(round.title) ||
      !isNonEmptyString(round.kind) ||
      !isNonEmptyString(round.penalty) ||
      !isNonEmptyString(round.winner) ||
      !isNonEmptyString(round.loser)
    ) return null;
    rounds.push(round as ProgressivePenaltyRoundResult);
  }
  if (value.completedRounds !== rounds.length || !isRecord(value.lastRound) || !isRecord(value.lossCounts) || typeof value.completedAt !== "string") return null;
  if (!Object.values(value.lossCounts).every((count) => typeof count === "number" && Number.isInteger(count) && count >= 0)) return null;
  const lastRound = rounds[rounds.length - 1];
  if (!lastRound) return null;
  if (value.lastRound.id !== lastRound.id || value.winner !== lastRound.winner || value.loser !== lastRound.loser || value.penalty !== lastRound.penalty) return null;
  return value as unknown as ProgressivePenaltyResult;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
