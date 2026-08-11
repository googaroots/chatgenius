"use client";

import { formatMoney, RULE_BREAK_LABEL, STARTING_POT } from "@/game/rules";
import type { GameState } from "@/game/types";

export default function Finale({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const f = state.finale;
  if (!f) return null;

  const breaks = state.log.filter((l) => l.ruleBreak);
  const lost = STARTING_POT - state.pot;

  return (
    <div className="rise-in mx-auto max-w-2xl">
      <p className="mb-2 text-[11px] font-bold tracking-[0.2em] text-heat-400 uppercase">
        Abschlusszeremonie
      </p>
      <div className="text-6xl" aria-hidden>
        {f.emoji}
      </div>
      <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{f.title}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Auszahlung" value={formatMoney(f.payout)} tone="text-emerald-300" />
        <Stat label="Rest im Pott" value={formatMoney(state.pot)} tone="text-white" />
        <Stat label="Verbrannt" value={formatMoney(lost)} tone="text-heat-400" />
        <Stat label="Einstufung" value={f.rank} tone="text-violet-300" small />
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-white/75">{f.text}</p>

      {f.partner ? (
        <div className="mt-6 flex items-center gap-4 rounded-3xl border border-heat-500/25 bg-heat-500/10 p-4">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl ${f.partner.gradient}`}
            aria-hidden
          >
            {f.partner.emoji}
          </span>
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-heat-300 uppercase">
              Deine stärkste Verbindung
            </div>
            <div className="text-lg font-bold text-white">
              {f.partner.name}, {f.partner.age}
            </div>
            <div className="text-sm text-white/55">
              {f.partner.job} aus {f.partner.city} · {state.connections[f.partner.id] ?? 0}%
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold tracking-[0.18em] text-white/45 uppercase">
          Lanas Protokoll
        </h2>
        {breaks.length === 0 ? (
          <p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Kein einziger Regelverstoß in neun Tagen. Lana hat das dreimal nachgerechnet.
          </p>
        ) : (
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {breaks.map((l, i) => (
              <li
                key={`${l.sceneId}-${i}`}
                className="flex items-center gap-3 bg-white/[0.03] px-4 py-3"
              >
                <span className="w-14 shrink-0 font-mono text-xs text-white/40">
                  Tag {l.day}
                </span>
                <span className="flex-1 text-sm text-white/80">
                  {RULE_BREAK_LABEL[l.ruleBreak!]}
                  <span className="text-white/35"> · {l.sceneTitle}</span>
                </span>
                <span className="font-mono text-sm font-semibold text-heat-400">
                  {formatMoney(l.money)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white/70">
          Alle {state.log.length} Entscheidungen ansehen
        </summary>
        <ol className="mt-3 space-y-2">
          {state.log.map((l, i) => (
            <li key={`${l.sceneId}-log-${i}`} className="text-sm text-white/55">
              <span className="font-mono text-xs text-white/30">T{l.day}</span>{" "}
              <span className="text-white/70">{l.sceneTitle}:</span> {l.choiceLabel}
            </li>
          ))}
        </ol>
      </details>

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 w-full rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-6 py-4 text-lg font-bold text-white shadow-xl shadow-heat-600/25 transition hover:brightness-110 active:scale-[0.99]"
      >
        Noch ein Retreat
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[10px] font-bold tracking-[0.14em] text-white/40 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 font-bold tabular-nums ${small ? "text-sm" : "text-lg"} ${tone}`}
      >
        {value}
      </div>
    </div>
  );
}
