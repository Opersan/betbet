"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, TriangleAlert } from "lucide-react";
import { validateProgressivePenaltyConfig } from "@/lib/journey/progressive-penalty";
import type { JsonRecord, JsonValue } from "@/lib/content-studio/types";
import { JsonConfigEditor } from "./JsonConfigEditor";

const labelFields = [
  ["revealLabel", "Kartları aç butonu"],
  ["confirmLabel", "Tur onay butonu"],
  ["completeLabel", "Final butonu"],
] as const;

export function ProgressivePenaltyConfigEditor({
  value,
  onChange,
  onValidityChange,
}: {
  value: JsonRecord;
  onChange: (value: JsonRecord) => void;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const validation = validateProgressivePenaltyConfig(value);
  const [rawJsonValid, setRawJsonValid] = useState(true);
  const players = Array.isArray(value.players) ? value.players : [];
  const rounds = Array.isArray(value.rounds) ? value.rounds : [];

  useEffect(() => {
    onValidityChange?.(validation.errors.length === 0 && rawJsonValid);
  }, [onValidityChange, rawJsonValid, validation.errors.length]);

  function updateRoot(key: string, nextValue: JsonValue) {
    onChange({ ...value, [key]: nextValue });
  }

  function updateRound(index: number, key: string, nextValue: JsonValue) {
    const nextRounds = [...rounds];
    const current = isRecord(nextRounds[index]) ? nextRounds[index] : {};
    nextRounds[index] = { ...current, [key]: nextValue };
    updateRoot("rounds", nextRounds);
  }

  function moveRound(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rounds.length) return;
    const nextRounds = [...rounds];
    [nextRounds[index], nextRounds[target]] = [nextRounds[target], nextRounds[index]];
    updateRoot("rounds", nextRounds);
  }

  return (
    <div className="grid gap-4">
      {validation.errors.length > 0 ? (
        <div className="rounded-[8px] border border-amber-300/24 bg-amber-300/8 p-4" role="alert">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <TriangleAlert size={17} aria-hidden="true" /> Config geçersiz
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-100/70">
            {validation.errors.map((error) => <li key={error}>• {error}</li>)}
          </ul>
        </div>
      ) : (
        <div className="rounded-[8px] border border-emerald-200/18 bg-emerald-200/7 px-3 py-2 text-xs text-emerald-100/72">
          Config geçerli; tur dengesi oyun başlatılırken bir kez üretilecek.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="studio-label">Versiyon</span>
          <input className="studio-input" value={String(value.version ?? "")} onChange={(event) => updateRoot("version", Number(event.target.value))} type="number" />
        </label>
        <label className="block">
          <span className="studio-label">Denge</span>
          <select className="studio-input" value={typeof value.balanceMode === "string" ? value.balanceMode : ""} onChange={(event) => updateRoot("balanceMode", event.target.value)}>
            <option value="">Seç</option>
            <option value="strict">strict</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm text-[#fffaf2]/72">
          <input type="checkbox" checked={value.allowReroll === true} onChange={(event) => updateRoot("allowReroll", event.target.checked)} />
          Yeniden seçim
        </label>
      </div>

      <div>
        <p className="studio-label">Oyuncular</p>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((index) => (
            <input
              key={index}
              className="studio-input"
              aria-label={`${index + 1}. oyuncu`}
              value={typeof players[index] === "string" ? players[index] : ""}
              onChange={(event) => {
                const nextPlayers: JsonValue[] = [
                  typeof players[0] === "string" ? players[0] : "",
                  typeof players[1] === "string" ? players[1] : "",
                ];
                nextPlayers[index] = event.target.value;
                updateRoot("players", nextPlayers);
              }}
              placeholder={`${index + 1}. oyuncu adı`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#fffaf2]">Turlar</p>
            <p className="mt-1 text-xs text-[#fffaf2]/48">Her turun cezası config içinde açıkça tanımlanır.</p>
          </div>
          <button
            className="studio-button"
            type="button"
            onClick={() => updateRoot("rounds", [
              ...rounds,
              { id: `round-${Date.now()}`, title: `${rounds.length + 1}. Tur`, kind: "penalty", penalty: "" },
            ])}
          >
            <Plus size={14} /> Tur ekle
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {rounds.map((round, index) => {
            const record = isRecord(round) ? round : {};
            return (
              <div key={`${typeof record.id === "string" ? record.id : "invalid"}-${index}`} className="rounded-[8px] border border-white/10 bg-[#080a16] p-3">
                {!isRecord(round) ? <p className="mb-2 text-xs text-[#f0b7c6]">Bu tur nesne değil; alanları düzenleyerek onarabilirsin.</p> : null}
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-2">
                  <input className="studio-input" aria-label={`${index + 1}. tur id`} value={asText(record.id)} onChange={(event) => updateRound(index, "id", event.target.value)} placeholder="round-id" />
                  <input className="studio-input" aria-label={`${index + 1}. tur başlığı`} value={asText(record.title)} onChange={(event) => updateRound(index, "title", event.target.value)} placeholder="Tur başlığı" />
                  <div className="flex gap-1">
                    <button className="studio-row-action" type="button" disabled={index === 0} onClick={() => moveRound(index, -1)} aria-label="Turu yukarı taşı"><ArrowUp size={13} /></button>
                    <button className="studio-row-action" type="button" disabled={index === rounds.length - 1} onClick={() => moveRound(index, 1)} aria-label="Turu aşağı taşı"><ArrowDown size={13} /></button>
                    <button className="studio-row-action text-[#f0b7c6]" type="button" onClick={() => updateRoot("rounds", rounds.filter((_, roundIndex) => roundIndex !== index))} aria-label="Turu sil"><Trash2 size={13} /></button>
                  </div>
                </div>
                <input className="studio-input mt-2" aria-label={`${index + 1}. tur türü`} value={asText(record.kind)} onChange={(event) => updateRound(index, "kind", event.target.value)} placeholder="kind" />
                <textarea className="studio-input mt-2 min-h-20 resize-y py-2" aria-label={`${index + 1}. tur cezası`} value={asText(record.penalty)} onChange={(event) => updateRound(index, "penalty", event.target.value)} placeholder="Ceza metni" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {labelFields.map(([key, title]) => (
          <label className="block" key={key}>
            <span className="studio-label">{title}</span>
            <input className="studio-input" value={asText(value[key])} onChange={(event) => updateRoot(key, event.target.value)} />
          </label>
        ))}
      </div>

      <label className="block">
        <span className="studio-label">Final metni</span>
        <textarea className="studio-input min-h-20 resize-y py-2" value={asText(value.finalText)} onChange={(event) => updateRoot("finalText", event.target.value)} />
      </label>

      <details className="rounded-[8px] border border-white/10 bg-white/[0.025] p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-[#f4dcc0]/65">Ham JSON</summary>
        <div className="mt-3">
          <JsonConfigEditor key={JSON.stringify(value)} label="Progressive Penalty Config" value={value} onChange={(next) => onChange(next as JsonRecord)} onValidityChange={setRawJsonValid} rows={16} />
        </div>
      </details>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}
