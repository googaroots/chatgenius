import { getContestant } from "@/game/data/cast";

export function LanaAvatar({ size = "size-11" }: { size?: string }) {
  return (
    <div
      className={`${size} grid shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-night-700 to-black ring-1 ring-heat-500/40`}
      aria-hidden
    >
      <span className="lana-eye block size-2.5 rounded-full bg-heat-500 shadow-[0_0_14px_5px_rgba(244,63,94,0.65)]" />
    </div>
  );
}

export default function SpeakerBubble({
  speaker,
  title,
  text,
}: {
  speaker: string;
  title?: string;
  text: string;
}) {
  const contestant = getContestant(speaker);
  const isLana = speaker === "lana";
  const isNarrator = speaker === "narrator";

  const name = isLana ? "Lana" : isNarrator ? "Die Villa" : (contestant?.name ?? speaker);

  return (
    <section
      className={`rise-in rounded-3xl border p-5 sm:p-6 ${
        isLana
          ? "border-heat-500/30 bg-gradient-to-b from-heat-500/12 to-transparent"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="mb-3.5 flex items-center gap-3">
        {isLana ? (
          <LanaAvatar />
        ) : (
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-2xl text-xl ${
              contestant
                ? `bg-gradient-to-br ${contestant.gradient}`
                : "bg-white/10"
            }`}
            aria-hidden
          >
            {contestant?.emoji ?? "🌴"}
          </div>
        )}
        <div className="min-w-0">
          <div
            className={`text-[11px] font-bold tracking-[0.18em] uppercase ${
              isLana ? "text-heat-300" : "text-white/45"
            }`}
          >
            {name}
          </div>
          {title ? (
            <h2 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h2>
          ) : null}
        </div>
      </div>

      <p
        className={`text-[15px] leading-relaxed sm:text-base ${
          isLana ? "text-heat-50/90 italic" : "text-white/75"
        }`}
      >
        {text}
      </p>
    </section>
  );
}
