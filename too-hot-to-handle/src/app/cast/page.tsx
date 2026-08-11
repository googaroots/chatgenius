import type { Metadata } from "next";
import { CAST } from "@/game/data/cast";

export const metadata: Metadata = {
  title: "Der Cast — Too Hot to Handle",
  description: "Zehn Singles, zehn Gründe, warum das Preisgeld nicht überleben wird.",
};

export default function CastPage() {
  return (
    <div className="py-6">
      <h1 className="text-4xl font-black text-white sm:text-5xl">Der Cast</h1>
      <p className="mt-3 max-w-xl text-white/55">
        Zehn Menschen, die alle überzeugt sind, dass sie diejenigen sind, die sich
        zusammenreißen können. Zwei von ihnen betreten die Villa erst später — und dann wird es
        teuer.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CAST.map((c) => (
          <article
            key={c.id}
            className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
          >
            <div
              className={`grid size-20 shrink-0 place-items-center self-start rounded-2xl bg-gradient-to-br text-3xl ${c.gradient}`}
              aria-hidden
            >
              {c.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="text-lg font-bold text-white">{c.name}</h2>
                <span className="text-sm text-white/45">
                  {c.age} · {c.job}, {c.city}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-heat-300 italic">
                „{c.tagline}“
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{c.bio}</p>
              {c.arrivesOnDay > 0 ? (
                <span className="mt-3 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                  Kommt an Tag {c.arrivesOnDay}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
