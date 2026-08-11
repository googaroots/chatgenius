import { CAST, getContestant } from "@/game/data/cast";
import { SCENES } from "@/game/data/scenes";
import { RULE_BREAK_COST, STARTING_POT, TOTAL_DAYS } from "@/game/rules";
import type {
  Choice,
  FinaleResult,
  Gender,
  GameState,
  Scene,
} from "@/game/types";

export const SAVE_VERSION = 1;

export function createInitialState(
  playerName: string,
  playerGender: Gender,
  playerEmoji: string,
): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    playerName: playerName.trim() || "Du",
    playerGender,
    playerEmoji,
    phase: "scene",
    day: 1,
    pot: STARTING_POT,
    growth: 0,
    trust: 50,
    connections: Object.fromEntries(CAST.map((c) => [c.id, 0])),
    crush: null,
    flags: [],
    seen: [],
    currentSceneId: null,
    lastOutcome: null,
    log: [],
    finale: null,
  };
  state.currentSceneId = pickNextScene(state)?.id ?? null;
  return state;
}

/** Erste noch nicht gespielte Szene des aktuellen Tages, deren Bedingung passt. */
export function pickNextScene(state: GameState): Scene | null {
  return (
    SCENES.find(
      (s) =>
        s.day === state.day &&
        !state.seen.includes(s.id) &&
        (!s.condition || s.condition(state)),
    ) ?? null
  );
}

export function getScene(id: string | null): Scene | null {
  if (!id) return null;
  return SCENES.find((s) => s.id === id) ?? null;
}

export function availableChoices(scene: Scene, state: GameState): Choice[] {
  return scene.choices.filter((c) => !c.requires || c.requires(state));
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export type Action =
  | { type: "hydrate"; state: GameState }
  | { type: "choose"; choiceId: string }
  | { type: "continue" }
  | { type: "reset" };

export function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === "hydrate") return action.state;
  if (!state) return state;

  switch (action.type) {
    case "choose":
      return applyChoice(state, action.choiceId);
    case "continue":
      return advance(state);
    case "reset":
      return createInitialState(state.playerName, state.playerGender, state.playerEmoji);
    default:
      return state;
  }
}

function applyChoice(state: GameState, choiceId: string): GameState {
  const scene = getScene(state.currentSceneId);
  if (!scene || state.phase !== "scene") return state;
  const choice = scene.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const e = choice.effects;
  const next: GameState = {
    ...state,
    connections: { ...state.connections },
    flags: [...state.flags],
    seen: [...state.seen, scene.id],
    log: [...state.log],
  };

  // Geldabzug: expliziter Betrag und/oder Regelverstoß
  let money = e.money ?? 0;
  if (e.ruleBreak) money -= RULE_BREAK_COST[e.ruleBreak];
  next.pot = Math.max(0, next.pot + money);
  // Tatsächlich abgezogen (falls der Pott vorher schon fast leer war)
  const actualMoney = next.pot - state.pot;

  next.growth = Math.max(0, next.growth + (e.growth ?? 0));
  next.trust = clamp(next.trust + (e.trust ?? 0), 0, 100);

  if (e.setCrush) next.crush = e.setCrush;

  const connectionTarget = e.target ?? next.crush;
  const connectionDelta = e.connection ?? 0;
  if (connectionTarget && connectionDelta !== 0) {
    next.connections[connectionTarget] = clamp(
      (next.connections[connectionTarget] ?? 0) + connectionDelta,
      0,
      100,
    );
    // Erste echte Verbindung wird automatisch zum Schwarm
    if (!next.crush && connectionDelta > 12) next.crush = connectionTarget;
  }

  if (e.flags?.length) {
    for (const f of e.flags) if (!next.flags.includes(f)) next.flags.push(f);
  }

  next.log.push({
    day: state.day,
    sceneId: scene.id,
    sceneTitle: scene.title,
    choiceLabel: choice.label,
    money: actualMoney,
    ruleBreak: e.ruleBreak,
  });

  next.phase = "outcome";
  next.lastOutcome = {
    text: choice.outcome,
    lana: choice.lana,
    money: actualMoney,
    growth: e.growth ?? 0,
    trust: e.trust ?? 0,
    connection: connectionDelta,
    connectionTo: connectionTarget ?? null,
    ruleBreak: e.ruleBreak,
  };

  return next;
}

function advance(state: GameState): GameState {
  if (state.phase === "outcome") {
    const nextScene = pickNextScene(state);
    if (nextScene) {
      return { ...state, phase: "scene", currentSceneId: nextScene.id, lastOutcome: null };
    }
    // Tag zu Ende
    if (state.day >= TOTAL_DAYS) {
      return { ...state, phase: "finale", lastOutcome: null, finale: computeFinale(state) };
    }
    return { ...state, phase: "daybreak", lastOutcome: null, currentSceneId: null };
  }

  if (state.phase === "daybreak") {
    let day = state.day + 1;
    let probe: GameState = { ...state, day };
    let scene = pickNextScene(probe);
    // Tage ohne passende Szenen überspringen
    while (!scene && day < TOTAL_DAYS) {
      day += 1;
      probe = { ...state, day };
      scene = pickNextScene(probe);
    }
    if (!scene) {
      return { ...state, day, phase: "finale", finale: computeFinale({ ...state, day }) };
    }
    return { ...state, day, phase: "scene", currentSceneId: scene.id, lastOutcome: null };
  }

  return state;
}

// ───────────────────────── Finale ─────────────────────────

export function computeFinale(state: GameState): FinaleResult {
  const partner = getContestant(state.crush);
  const bond = state.crush ? (state.connections[state.crush] ?? 0) : 0;
  const potRatio = state.pot / STARTING_POT;

  const breaks = state.log.filter((l) => l.ruleBreak).length;
  const cleanRun = breaks === 0;
  const greenLight = state.flags.includes("gruenes-licht");
  const bigBreaker = state.log.some((l) => l.ruleBreak === "sex");

  // Jeder Verstoß kostet nicht nur Geld, sondern auch Lanas Urteil
  const score =
    state.growth * 1.0 + state.trust * 0.5 + bond * 0.45 + potRatio * 55 - breaks * 15;

  // Anteil am verbleibenden Pott
  let share = clamp((score - 60) / 140, 0, 1) * 0.75 + (greenLight ? 0.1 : 0);
  if (cleanRun) share += 0.1;
  share -= Math.min(0.32, breaks * 0.08);
  share = clamp(share, 0.05, 0.9);
  const payout = Math.round((state.pot * share) / 500) * 500;

  // Der Spitzentitel ist nur zu haben, wenn auch der Pott weitgehend intakt ist
  const rank =
    score >= 190 && potRatio >= 0.75
      ? "Retreat-Legende"
      : score >= 150
        ? "Emotional gereift"
        : score >= 110
          ? "Auf dem Weg"
          : score >= 70
            ? "Solide durchgekommen"
            : "Lernprozess offen";

  let endingId: string;
  let title: string;
  let text: string;
  let emoji: string;

  if (state.pot <= 25_000) {
    endingId = "bankrott";
    emoji = "💸";
    title = "Der teuerste Urlaub deines Lebens";
    text = `Von ${STARTING_POT.toLocaleString("de-DE")} € sind noch ${state.pot.toLocaleString("de-DE")} € übrig. Lana verliest die Liste der Verstöße wie ein Gerichtsurteil, und deine Name kommt darin häufiger vor, als dir lieb ist. Draußen wartet eine Person auf dich, die dich trotzdem wiedersehen will. Ob das ${state.pot.toLocaleString("de-DE")} € wert war, entscheidest du in den nächsten Monaten.`;
  } else if (state.growth >= 90 && bond >= 60 && state.pot >= 60_000) {
    endingId = "sieg-mit-partner";
    emoji = "🏆";
    title = "Ihr habt es beide verstanden";
    text = `Lana verkündet, dass sie in neun Tagen selten so viel echte Entwicklung gemessen hat. Du bekommst ${payout.toLocaleString("de-DE")} € und – wichtiger – du verlässt die Villa nicht allein.${partner ? ` ${partner.name} steht am Steg und wartet, ohne auf die Kameras zu schauen.` : ""} Die Reunion-Folge in sechs Monaten wird euch beide sehr glücklich zeigen.`;
  } else if (state.growth >= 90 && state.pot >= 60_000) {
    endingId = "sieg-allein";
    emoji = "🌅";
    title = "Allein, aber zum ersten Mal ganz";
    text = `Du gehst ohne Beziehung, aber mit etwas, das du nicht mitgebracht hast: einer ehrlichen Vorstellung davon, warum du dich sonst immer zurückziehst. Lana überreicht dir ${payout.toLocaleString("de-DE")} € und sagt den Satz, den sie sonst nie sagt: „Ich habe nichts hinzuzufügen.“`;
  } else if (bond >= 60 && (bigBreaker || state.pot < 60_000)) {
    endingId = "teuer-verliebt";
    emoji = "🔥";
    title = "Teuer. Aber echt.";
    text = `Die Gruppe rechnet dir vor, was du gekostet hast. Du kannst nichts dagegen sagen — außer, dass du${partner ? ` ${partner.name}` : " jemanden"} gefunden hast. ${payout.toLocaleString("de-DE")} € gehen an dich, deutlich weniger, als möglich gewesen wäre. Beim Abschied fragt Lana, ob du es wieder so machen würdest. Du zögerst zu lange, um überzeugend Nein zu sagen.`;
  } else if (state.trust >= 70 && state.growth >= 55) {
    endingId = "herz-der-villa";
    emoji = "🫶";
    title = "Das Herz der Villa";
    text = `Du hast keine große Romanze mitgenommen, aber acht Menschen, die dich als den beschreiben, der alles zusammengehalten hat. ${payout.toLocaleString("de-DE")} € und eine Gruppenchat-Gruppe, die noch zwei Jahre aktiv sein wird.`;
  } else if (state.growth < 35) {
    endingId = "beobachter";
    emoji = "🪑";
    title = "Neun Tage, nichts riskiert";
    text = `Du hast kein Geld verbrannt und keine Regel gebrochen. Du hast aber auch nichts gefühlt. Lana fasst es sachlich zusammen: „Keine Verstöße. Keine Entwicklung. Ein sehr ruhiger Datensatz.“ Du bekommst ${payout.toLocaleString("de-DE")} € und das leise Gefühl, dass die anderen etwas erlebt haben, das du dir nur angesehen hast.`;
  } else {
    endingId = "mittendrin";
    emoji = "🌴";
    title = "Irgendwo dazwischen";
    text = `Kein Triumph, kein Desaster. Du hast geflirtet, dich zweimal wirklich geöffnet und einmal zu spät den Mund gehalten. ${payout.toLocaleString("de-DE")} € und die Erkenntnis, dass du an manchen Stellen mutiger hättest sein können.${partner ? ` ${partner.name} umarmt dich am Steg etwas zu lang für „nur Freunde“.` : ""}`;
  }

  return { endingId, title, text, payout, partner, rank, emoji };
}
