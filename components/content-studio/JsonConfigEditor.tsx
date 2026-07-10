"use client";

import { useMemo, useState } from "react";

export function JsonConfigEditor({
  label,
  value,
  onChange,
  rows = 8,
}: {
  label: string;
  value: unknown;
  onChange: (nextValue: Record<string, unknown>) => void;
  rows?: number;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const error = useMemo(() => {
    try {
      JSON.parse(text);
      return null;
    } catch (caughtError) {
      return caughtError instanceof Error ? caughtError.message : "JSON parse edilemedi.";
    }
  }, [text]);

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-[#f4dcc0]/72">
        {label}
        <button
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] normal-case tracking-normal text-[#fffaf2]/70 hover:bg-white/10"
          type="button"
          onClick={() => {
            try {
              const parsed = JSON.parse(text);
              const formatted = JSON.stringify(parsed, null, 2);
              setText(formatted);
              onChange(parsed);
            } catch {
              // The inline error already explains the parse issue.
            }
          }}
        >
          Formatla
        </button>
      </span>
      <textarea
        className="w-full rounded-[8px] border border-white/10 bg-[#080a16] px-3 py-2 font-mono text-xs leading-5 text-[#fffaf2]/86 outline-none focus:border-[#f4dcc0]/38"
        rows={rows}
        value={text}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          try {
            const parsed = JSON.parse(nextText);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              onChange(parsed as Record<string, unknown>);
            }
          } catch {
            // Keep local text so the user can fix invalid JSON.
          }
        }}
      />
      {error ? <span className="mt-2 block text-xs text-[#f0b7c6]">{error}</span> : null}
    </label>
  );
}
