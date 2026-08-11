export type Gender = "w" | "m" | "d";

export interface Contestant {
  id: string;
  name: string;
  age: number;
  city: string;
  job: string;
  gender: Gender;
  tagline: string;
  bio: string;
  emoji: string;
  /** Tailwind gradient classes fuer das Profilbild-Placeholder */
  gradient: string;
  /** Tag, an dem die Person die Villa betritt (0 = von Anfang an dabei) */
  arrivesOnDay: number;
}

export type RuleBreak = "kuss" | "petting" | "sex" | "solo";

export interface Effects {
  /** Negativer Betrag = Abzug vom Preisgeld */
  money?: number;
  /** Persoenliche Entwicklung */
  growth?: number;
  /** Ansehen in der Gruppe */
  trust?: number;
  /** Verbindung zur aktuellen Person (oder zu `target`) */
  connection?: number;
  /** Verbindung gezielt zu einer bestimmten Person */
  target?: string;
  /** Setzt den aktuellen Schwarm */
  setCrush?: string;
  /** Merkmale, die spaetere Szenen freischalten */
  flags?: string[];
  ruleBreak?: RuleBreak;
}

export type Risk = "safe" | "flirty" | "rulebreak" | "growth";

export interface Choice {
  id: string;
  label: string;
  risk: Risk;
  /** Text, der nach der Wahl erzaehlt wird */
  outcome: string;
  /** Lanas Reaktion, falls sie sich einmischt */
  lana?: string;
  effects: Effects;
  /** Nur waehlbar, wenn erfuellt */
  requires?: (s: GameState) => boolean;
}

export interface Scene {
  id: string;
  day: number;
  title: string;
  /** "lana" | "narrator" | Contestant-ID */
  speaker: "lana" | "narrator" | string;
  text: string;
  choices: Choice[];
  /** Szene erscheint nur, wenn erfuellt */
  condition?: (s: GameState) => boolean;
}

export type Phase = "intro" | "scene" | "outcome" | "daybreak" | "finale";

export interface LogEntry {
  day: number;
  sceneId: string;
  sceneTitle: string;
  choiceLabel: string;
  money: number;
  ruleBreak?: RuleBreak;
}

export interface GameState {
  version: number;
  playerName: string;
  playerGender: Gender;
  playerEmoji: string;
  phase: Phase;
  day: number;
  pot: number;
  growth: number;
  trust: number;
  /** Verbindungswerte je Contestant-ID */
  connections: Record<string, number>;
  crush: string | null;
  flags: string[];
  /** Bereits gespielte Szenen */
  seen: string[];
  currentSceneId: string | null;
  /** Ergebnis der letzten Wahl, solange phase === "outcome" */
  lastOutcome: {
    text: string;
    lana?: string;
    money: number;
    growth: number;
    trust: number;
    connection: number;
    connectionTo: string | null;
    ruleBreak?: RuleBreak;
  } | null;
  log: LogEntry[];
  finale: FinaleResult | null;
}

export interface FinaleResult {
  endingId: string;
  title: string;
  text: string;
  payout: number;
  partner: Contestant | null;
  rank: string;
  emoji: string;
}
