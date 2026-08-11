"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, STARTING_POT, TOTAL_DAYS } from "@/game/rules";

function Meter({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-white/70">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Hud({
  day,
  pot,
  growth,
  trust,
}: {
  day: number;
  pot: number;
  growth: number;
  trust: number;
}) {
  const [flash, setFlash] = useState(false);
  const prevPot = useRef(pot);

  useEffect(() => {
    if (pot < prevPot.current) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 600);
      prevPot.current = pot;
      return () => window.clearTimeout(t);
    }
    prevPot.current = pot;
  }, [pot]);

  const potPct = Math.round((pot / STARTING_POT) * 100);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/10 bg-night-900/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className={flash ? "shake-money" : undefined}>
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Preisgeld
          </div>
          <div
            className={`font-mono text-2xl font-bold tabular-nums transition-colors ${
              potPct > 60 ? "text-emerald-300" : potPct > 30 ? "text-amber-300" : "text-heat-400"
            }`}
          >
            {formatMoney(pot)}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Retreat
          </div>
          <div className="text-sm font-semibold text-white">
            Tag {Math.min(day, TOTAL_DAYS)}
            <span className="text-white/40"> / {TOTAL_DAYS}</span>
          </div>
        </div>

        <div className="flex min-w-[14rem] flex-1 gap-4">
          <Meter
            label="Entwicklung"
            value={growth}
            max={140}
            tone="bg-gradient-to-r from-violet-400 to-fuchsia-400"
          />
          <Meter
            label="Ansehen"
            value={trust}
            max={100}
            tone="bg-gradient-to-r from-amber-400 to-heat-400"
          />
        </div>
      </div>
    </div>
  );
}
