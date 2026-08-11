"use client";

import { useState } from "react";
import { PLAYER_EMOJIS } from "@/game/data/cast";
import { STARTING_POT, TOTAL_DAYS } from "@/game/rules";
import type { Gender } from "@/game/types";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "w", label: "weiblich" },
  { value: "m", label: "männlich" },
  { value: "d", label: "divers" },
];

export default function Setup({
  onStart,
}: {
  onStart: (name: string, gender: Gender, emoji: string) => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("d");
  const [emoji, setEmoji] = useState(PLAYER_EMOJIS[0]);

  return (
    <div className="rise-in mx-auto max-w-xl">
      <p className="mb-2 text-[11px] font-bold tracking-[0.2em] text-heat-400 uppercase">
        Check-in
      </p>
      <h1 className="text-3xl font-black text-white sm:text-4xl">Wer betritt die Villa?</h1>
      <p className="mt-3 text-white/55">
        {TOTAL_DAYS} Tage, {STARTING_POT.toLocaleString("de-DE")} € gemeinsames Preisgeld und
        eine KI, die jede Berührung mitzählt. Deine Entscheidungen kosten Geld – oder bringen
        dich weiter.
      </p>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name, gender, emoji);
        }}
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-[11px] font-bold tracking-[0.18em] text-white/50 uppercase"
          >
            Dein Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="z. B. Alex"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/25 focus:border-heat-500 focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/50 uppercase">
            Geschlecht
          </legend>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                aria-pressed={gender === g.value}
                className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                  gender === g.value
                    ? "border-heat-500 bg-heat-500/15 text-white"
                    : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-bold tracking-[0.18em] text-white/50 uppercase">
            Dein Vibe
          </legend>
          <div className="flex flex-wrap gap-2">
            {PLAYER_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                aria-label={`Vibe ${e}`}
                className={`grid size-12 place-items-center rounded-2xl border text-xl transition ${
                  emoji === e
                    ? "border-heat-500 bg-heat-500/20 scale-105"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-6 py-4 text-lg font-bold text-white shadow-xl shadow-heat-600/25 transition hover:brightness-110 active:scale-[0.99]"
        >
          Ins Retreat einchecken
        </button>
      </form>
    </div>
  );
}
