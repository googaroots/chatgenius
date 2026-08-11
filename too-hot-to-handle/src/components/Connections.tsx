import { CAST, getContestant } from "@/game/data/cast";
import type { GameState } from "@/game/types";

export default function Connections({ state }: { state: GameState }) {
  const visible = CAST.filter((c) => c.arrivesOnDay <= state.day)
    .map((c) => ({ c, value: state.connections[c.id] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const crush = getContestant(state.crush);

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-1 text-[11px] font-bold tracking-[0.18em] text-white/45 uppercase">
        Verbindungen
      </h3>
      {crush ? (
        <p className="mb-4 text-sm text-white/60">
          Dein Fokus liegt auf{" "}
          <span className="font-semibold text-heat-300">{crush.name}</span>.
        </p>
      ) : (
        <p className="mb-4 text-sm text-white/40">Noch niemand hat dich richtig erwischt.</p>
      )}

      <ul className="space-y-2.5">
        {visible.map(({ c, value }) => (
          <li key={c.id} className="flex items-center gap-3">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm ${c.gradient}`}
              aria-hidden
            >
              {c.emoji}
            </span>
            <span className="w-16 shrink-0 truncate text-sm font-medium text-white/80">
              {c.name}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-heat-500 to-fuchsia-400 transition-[width] duration-700"
                style={{ width: `${value}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-white/45">
              {value}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
