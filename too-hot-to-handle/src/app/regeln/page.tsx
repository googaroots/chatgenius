import type { Metadata } from "next";
import Link from "next/link";
import { RULES } from "@/game/rules";

export const metadata: Metadata = {
  title: "Lanas Regeln — Too Hot to Handle",
  description: "Kein Küssen, kein Petting, kein Sex. Und was das jeweils kostet.",
};

export default function RulesPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-4">
        <div
          className="grid size-16 place-items-center rounded-3xl bg-gradient-to-b from-night-700 to-black ring-1 ring-heat-500/40"
          aria-hidden
        >
          <span className="lana-eye block size-3.5 rounded-full bg-heat-500 shadow-[0_0_20px_7px_rgba(244,63,94,0.6)]" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Lanas Regeln</h1>
          <p className="text-white/45">Nicht verhandelbar. Sofia hat es versucht.</p>
        </div>
      </div>

      <blockquote className="mt-8 rounded-3xl border border-heat-500/30 bg-gradient-to-b from-heat-500/12 to-transparent p-6 text-lg leading-relaxed text-heat-50/90 italic">
        „Dieses Retreat dient nicht eurer körperlichen Befriedigung, sondern eurer emotionalen
        Entwicklung. Ich sehe alles. Ich rechne alles ab. Und ich schlafe nie.“
      </blockquote>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {RULES.map((r) => (
          <div key={r.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-2xl" aria-hidden>
              {r.icon}
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">{r.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">{r.text}</p>
          </div>
        ))}
      </div>

      <Link
        href="/spielen"
        className="mt-8 inline-block rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-heat-600/25 transition hover:brightness-110"
      >
        Verstanden — Retreat starten
      </Link>
    </div>
  );
}
