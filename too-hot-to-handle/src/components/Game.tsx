"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import ChoiceList from "@/components/ChoiceList";
import Connections from "@/components/Connections";
import Finale from "@/components/Finale";
import Hud from "@/components/Hud";
import Setup from "@/components/Setup";
import SpeakerBubble, { LanaAvatar } from "@/components/SpeakerBubble";
import {
  availableChoices,
  createInitialState,
  getScene,
  reducer,
  type Action,
} from "@/game/engine";
import { RULE_BREAK_LABEL, TOTAL_DAYS, formatMoney } from "@/game/rules";
import { getContestant } from "@/game/data/cast";
import { clearGame, loadGame, saveGame } from "@/game/storage";
import type { Gender, GameState } from "@/game/types";

type Screen = { kind: "loading" } | { kind: "setup" } | { kind: "resume"; save: GameState };

export default function Game() {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [state, dispatch] = useReducer(reducer, null);

  // Spielstand einmalig nach dem Mount laden (kein SSR-Zugriff auf localStorage)
  useEffect(() => {
    const save = loadGame();
    setScreen(save ? { kind: "resume", save } : { kind: "setup" });
  }, []);

  // Autosave
  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  const start = useCallback((name: string, gender: Gender, emoji: string) => {
    clearGame();
    dispatch({ type: "hydrate", state: createInitialState(name, gender, emoji) });
  }, []);

  if (!state) {
    if (screen.kind === "loading") {
      return <div className="py-20 text-center text-white/40">Lade Retreat …</div>;
    }
    if (screen.kind === "resume") {
      return (
        <ResumePrompt
          save={screen.save}
          onResume={() => dispatch({ type: "hydrate", state: screen.save })}
          onFresh={() => {
            clearGame();
            setScreen({ kind: "setup" });
          }}
        />
      );
    }
    return <Setup onStart={start} />;
  }

  return <Play state={state} dispatch={dispatch} />;
}

function ResumePrompt({
  save,
  onResume,
  onFresh,
}: {
  save: GameState;
  onResume: () => void;
  onFresh: () => void;
}) {
  return (
    <div className="rise-in mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
      <div className="text-4xl" aria-hidden>
        {save.playerEmoji}
      </div>
      <h1 className="mt-3 text-2xl font-black text-white">Willkommen zurück, {save.playerName}</h1>
      <p className="mt-2 text-white/55">
        Du bist an Tag {Math.min(save.day, TOTAL_DAYS)} von {TOTAL_DAYS}. Im Pott sind noch{" "}
        <span className="font-semibold text-white">{formatMoney(save.pot)}</span>.
      </p>
      <div className="mt-6 grid gap-2.5">
        <button
          type="button"
          onClick={onResume}
          className="rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-heat-600/25 transition hover:brightness-110"
        >
          Weiterspielen
        </button>
        <button
          type="button"
          onClick={onFresh}
          className="rounded-2xl border border-white/15 px-6 py-3.5 font-semibold text-white/70 transition hover:bg-white/10"
        >
          Neu starten
        </button>
      </div>
    </div>
  );
}

function Play({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const scene = getScene(state.currentSceneId);
  const choices = scene ? availableChoices(scene, state) : [];
  const topRef = useRef<HTMLDivElement>(null);

  const choose = useCallback(
    (id: string) => dispatch({ type: "choose", choiceId: id }),
    [dispatch],
  );
  const cont = useCallback(() => dispatch({ type: "continue" }), [dispatch]);

  // Tastatursteuerung: 1–4 wählt, Enter/Leertaste blättert weiter
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (state.phase === "scene") {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < choices.length) {
          e.preventDefault();
          choose(choices[idx].id);
        }
      } else if (state.phase === "outcome" || state.phase === "daybreak") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cont();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, choices, choose, cont]);

  // Bei jedem Szenenwechsel nach oben scrollen
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [state.currentSceneId, state.phase]);

  if (state.phase === "finale") {
    return (
      <Finale
        state={state}
        onRestart={() => {
          clearGame();
          dispatch({ type: "reset" });
        }}
      />
    );
  }

  return (
    <div>
      <div ref={topRef} />
      <Hud day={state.day} pot={state.pot} growth={state.growth} trust={state.trust} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          {state.phase === "daybreak" ? (
            <DayBreak day={state.day + 1} onContinue={cont} />
          ) : state.phase === "outcome" && state.lastOutcome ? (
            <Outcome state={state} onContinue={cont} />
          ) : scene ? (
            <>
              <SpeakerBubble speaker={scene.speaker} title={scene.title} text={scene.text} />
              <ChoiceList choices={choices} onChoose={choose} />
              <p className="mt-3 hidden text-xs text-white/25 sm:block">
                Tipp: Mit den Tasten 1–{choices.length} wählst du schneller.
              </p>
            </>
          ) : (
            <p className="text-white/40">Diese Szene ist nicht mehr verfügbar.</p>
          )}
        </div>

        <Connections state={state} />
      </div>
    </div>
  );
}

function DayBreak({ day, onContinue }: { day: number; onContinue: () => void }) {
  return (
    <div className="rise-in rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-8 text-center">
      <div className="text-[11px] font-bold tracking-[0.24em] text-heat-400 uppercase">
        Sonnenaufgang
      </div>
      <div className="mt-2 text-5xl font-black text-white">Tag {day}</div>
      <p className="mx-auto mt-3 max-w-sm text-white/50">
        Die Villa wacht auf. Irgendjemand hat heute Nacht etwas getan, das Geld gekostet hat.
        Vielleicht warst du es.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 rounded-2xl bg-white/10 px-8 py-3 font-semibold text-white transition hover:bg-white/20"
      >
        Aufstehen
      </button>
    </div>
  );
}

function Outcome({ state, onContinue }: { state: GameState; onContinue: () => void }) {
  const o = state.lastOutcome!;
  const target = getContestant(o.connectionTo);

  const deltas: { label: string; value: number; tone: string }[] = [];
  if (o.money !== 0)
    deltas.push({ label: "Preisgeld", value: o.money, tone: "text-heat-400" });
  if (o.growth !== 0)
    deltas.push({ label: "Entwicklung", value: o.growth, tone: "text-violet-300" });
  if (o.trust !== 0) deltas.push({ label: "Ansehen", value: o.trust, tone: "text-amber-300" });
  if (o.connection !== 0 && target)
    deltas.push({ label: target.name, value: o.connection, tone: "text-fuchsia-300" });

  return (
    <div className="rise-in">
      {o.ruleBreak ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-heat-500/40 bg-heat-500/15 px-4 py-3">
          <span className="text-2xl" aria-hidden>
            🚨
          </span>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-heat-300 uppercase">
              Regelverstoß · {RULE_BREAK_LABEL[o.ruleBreak]}
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {formatMoney(o.money)}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <p className="text-[15px] leading-relaxed text-white/80 sm:text-base">{o.text}</p>

        {deltas.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {deltas.map((d) => (
              <span
                key={d.label}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold"
              >
                <span className="text-white/45">{d.label} </span>
                <span className={d.tone}>
                  {d.value > 0 ? "+" : ""}
                  {d.label === "Preisgeld" ? formatMoney(d.value) : d.value}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {o.lana ? (
        <div className="mt-4 flex gap-3 rounded-3xl border border-heat-500/30 bg-gradient-to-b from-heat-500/12 to-transparent p-5">
          <LanaAvatar size="size-9" />
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-heat-300 uppercase">
              Lana
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-heat-50/90 italic">{o.lana}</p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-heat-600 to-orange-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-heat-600/25 transition hover:brightness-110 active:scale-[0.99]"
      >
        Weiter
      </button>
    </div>
  );
}
