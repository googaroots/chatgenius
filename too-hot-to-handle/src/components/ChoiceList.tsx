"use client";

import type { Choice, Risk } from "@/game/types";

const RISK_META: Record<Risk, { label: string; className: string }> = {
  safe: { label: "Sicher", className: "bg-sky-400/15 text-sky-200 ring-sky-400/30" },
  growth: {
    label: "Entwicklung",
    className: "bg-violet-400/15 text-violet-200 ring-violet-400/30",
  },
  flirty: { label: "Riskant", className: "bg-amber-400/15 text-amber-200 ring-amber-400/30" },
  rulebreak: {
    label: "Regelbruch",
    className: "bg-heat-500/20 text-heat-300 ring-heat-500/40",
  },
};

export default function ChoiceList({
  choices,
  onChoose,
}: {
  choices: Choice[];
  onChoose: (id: string) => void;
}) {
  return (
    <div className="mt-5 grid gap-2.5">
      {choices.map((c, i) => {
        const meta = RISK_META[c.risk];
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChoose(c.id)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-heat-500/50 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heat-400"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 font-mono text-xs font-bold text-white/50 transition group-hover:bg-heat-500 group-hover:text-white">
              {i + 1}
            </span>
            <span className="flex-1 text-[15px] font-medium text-white/90">{c.label}</span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ring-1 ring-inset ${meta.className}`}
            >
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
