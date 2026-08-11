import Link from "next/link";
import { CAST } from "@/game/data/cast";
import { RULE_BREAK_COST, STARTING_POT, TOTAL_DAYS } from "@/game/rules";

const FEATURES = [
  {
    icon: "🕹️",
    title: "Jede Wahl kostet",
    text: `Küssen, Petting, Sex — Lana zieht in Echtzeit vom gemeinsamen Preisgeld ab. Ein Ausrutscher kann ${RULE_BREAK_COST.sex.toLocaleString("de-DE")} € kosten.`,
  },
  {
    icon: "💞",
    title: "Verbindungen wachsen",
    text: "Zu jeder Person in der Villa baust du einen Wert auf. Wer dich am Ende am Steg erwartet, entscheidest du über neun Tage.",
  },
  {
    icon: "🌱",
    title: "Entwicklung schlägt Geld",
    text: "Workshops, ehrliche Gespräche, verweigerte Versuchungen: Wer emotional wächst, bekommt am Ende mehr — und vielleicht grünes Licht.",
  },
  {
    icon: "🎬",
    title: "Sieben Enden",
    text: "Vom Bankrott bis zur Retreat-Legende. Dein Protokoll listet jeden Verstoß und jede Entscheidung auf.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="py-10 sm:py-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-heat-500/30 bg-heat-500/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.18em] text-heat-300 uppercase">
          <span className="lana-eye size-1.5 rounded-full bg-heat-500" />
          Staffel 1 · {TOTAL_DAYS} Tage
        </p>

        <h1 className="text-5xl leading-[0.95] font-black tracking-tight text-white sm:text-7xl">
          Too Hot
          <br />
          <span className="bg-gradient-to-r from-heat-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            to Handle
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/60">
          Acht Singles, eine Villa und {STARTING_POT.toLocaleString("de-DE")} € Preisgeld. Der
          Haken: Jede Berührung kostet. Triff die Entscheidungen, halte den Pott zusammen — oder
          verbrenne ihn in einer einzigen Nacht.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/spielen"
            className="rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-heat-600/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            Retreat starten
          </Link>
          <Link
            href="/regeln"
            className="rounded-2xl border border-white/15 px-8 py-4 text-lg font-semibold text-white/75 transition hover:bg-white/10"
          >
            Regeln lesen
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="text-2xl" aria-hidden>
              {f.icon}
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-white sm:text-3xl">Der Cast</h2>
          <Link
            href="/cast"
            className="shrink-0 text-sm font-semibold text-heat-300 transition hover:text-heat-200"
          >
            Alle Profile →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {CAST.map((c) => (
            <div key={c.id} className="w-32 shrink-0">
              <div
                className={`grid aspect-[3/4] place-items-center rounded-2xl bg-gradient-to-br text-4xl ${c.gradient}`}
                aria-hidden
              >
                {c.emoji}
              </div>
              <div className="mt-2 text-sm font-bold text-white">
                {c.name}, {c.age}
              </div>
              <div className="text-xs text-white/45">{c.city}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
