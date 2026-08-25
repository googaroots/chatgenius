/**
 * Technogym HIT — Plandaten
 *
 * Basis: Trainingsplan "Technogym HIT 5er-Split" (Mo/Mi/Fr/Sa/So).
 * Ergänzt um das Hybrid-Programm, das jede Muskelgruppe zweimal pro Woche
 * trifft — Hintergrund siehe EVIDENCE am Ende der Datei.
 */

// Satz-Struktur pro Übung: 3 Aufwärmsätze rampen auf das eine Top-Set hoch.
const RAMP = [
  { nr: 1, label: "Aufwärmen",    pct: 0.50, reps: "10–12", hint: "Locker, nur Blutfluss & Technik", rest: 60 },
  { nr: 2, label: "Vorbereitung", pct: 0.70, reps: "5–6",   hint: "Ohne Reiz — kein Ausbelasten",    rest: 90 },
  { nr: 3, label: "Aktivierung",  pct: 0.85, reps: "2–3",   hint: "ZNS-Fokus, explosiv drücken",     rest: 150 },
  { nr: 4, label: "TOP SET",      pct: 1.00, reps: "6–8",   hint: "Bis zum Muskelversagen",          rest: 180, top: true }
];

// Zusatzvolumen nach dem Top-Set — der Hebel aus der Studienlage.
const EXTRA_SETS = {
  backoff: {
    id: "backoff",
    label: "Back-off-Satz",
    short: "Back-off",
    pct: 0.875,
    reps: "6–10",
    hint: "1 Wdh. vor dem Versagen stoppen",
    rest: 120,
    hardSets: 1,
    describe: "90 s Pause, ~12 % weniger Gewicht, wieder 6–10 Wdh."
  },
  restpause: {
    id: "restpause",
    label: "Rest-Pause",
    short: "Rest-Pause",
    pct: 1.00,
    reps: "3–5 + 2–3",
    hint: "15–20 Atemzüge Pause, dann zwei kurze Blöcke",
    rest: 120,
    hardSets: 2,
    describe: "Gleiches Gewicht, zwei Mini-Blöcke — zählt wie zwei harte Sätze."
  }
};

const MUSCLES = {
  brust: "Brust",
  ruecken: "Rücken",
  schultern: "Schultern",
  bizeps: "Bizeps",
  trizeps: "Trizeps",
  quads: "Quadrizeps",
  hamstrings: "Hamstrings",
  huefte: "Gesäß & Hüfte",
  waden: "Waden",
  bauch: "Bauch"
};

// step = Gewichtssprung beim Progressions-Vorschlag und Rundung der Aufwärmsätze (kg).
// primary zählt voll, secondary zur Hälfte — wie in den Volumen-Meta-Analysen üblich.
const EXERCISES = {
  "chest-press": {
    name: "Chest Press",
    machine: "Selection / Pure Strength",
    target: "Ganze Brust, vordere Schulter",
    primary: "brust", secondary: ["trizeps", "schultern"],
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Höhe der unteren Brust liegen. Schulterblätter fest an die Lehne.",
    hit: "Geführte Trajektorie — sicheres Muskelversagen im Top-Set auch ohne Spotter."
  },
  "incline-chest-press": {
    name: "Incline Chest Press",
    machine: "Selection / Pure Strength",
    target: "Obere Brust (Schlüsselbein)",
    primary: "brust", secondary: ["schultern", "trizeps"],
    step: 2.5,
    tip: "Ellbogen ca. 45° zum Körper, am Ende nicht komplett durchstrecken.",
    hit: "Schräger Winkel trifft die schlüsselbeinnahen Fasern, die die Flat Press auslässt."
  },
  "pectoral-fly": {
    name: "Pectoral Machine / Cable Fly",
    machine: "Selection",
    target: "Isolierter Brust-Stretch & Squeeze",
    primary: "brust", secondary: [],
    step: 2.5,
    tip: "Ellbogen leicht gebeugt fixieren, 1 Sekunde in der Endkontraktion halten.",
    hit: "Reine Adduktion ohne Trizeps — der Brustmuskel versagt zuerst."
  },
  "triceps-press": {
    name: "Triceps Press / Dip Machine",
    machine: "Selection",
    target: "Trizeps (Masse & Gesamtkraft)",
    primary: "trizeps", secondary: ["brust"],
    step: 2.5,
    tip: "Oberkörper aufrecht, Ellbogen dicht am Rumpf führen.",
    hit: "Mehrgelenkig — erlaubt echte Maximallast auf den Trizeps."
  },

  "leg-press": {
    name: "Leg Press",
    machine: "Selection / Pure Strength",
    target: "Gesamte Beinmuskulatur, Quads",
    primary: "quads", secondary: ["huefte", "hamstrings"],
    step: 5,
    tip: "Füße schulterbreit mittig, Knie in Fußrichtung, unterer Rücken bleibt am Polster.",
    hit: "Extreme Beinbelastung ohne axiale Stauchung der Wirbelsäule."
  },
  "leg-extension": {
    name: "Leg Extension",
    machine: "Selection",
    target: "Isolierter Beinstrecker (Quad-Peak)",
    primary: "quads", secondary: [],
    step: 2.5,
    tip: "Drehachse auf Kniehöhe einstellen, oben kurz halten, langsam ablassen.",
    hit: "Volle Quad-Isolation — perfekt zum Nachbrennen nach der Leg Press."
  },
  "abductor-adductor": {
    name: "Abductor / Adductor",
    machine: "Selection",
    target: "Hüftstabilisatoren & Innenseite",
    primary: "huefte", secondary: [],
    step: 2.5,
    tip: "Beide Geräte im Wechsel: erst Abductor (außen), dann Adductor (innen).",
    hit: "Stabilisiert die Hüfte und schützt die Knie bei schweren Top-Sets."
  },
  "abdominal-crunch": {
    name: "Abdominal Crunch",
    machine: "Selection",
    target: "Gerade Bauchmuskeln",
    primary: "bauch", secondary: [],
    step: 2.5,
    tip: "Bewegung aus der Bauchmuskulatur, nicht aus den Armen. Ausatmen beim Einrollen.",
    hit: "Bauch lässt sich hier genauso progressiv belasten wie jeder andere Muskel."
  },

  "vertical-traction": {
    name: "Vertical Traction / Lat Machine",
    machine: "Selection",
    target: "Latissimus Dorsi (Rückenbreite)",
    primary: "ruecken", secondary: ["bizeps"],
    step: 2.5,
    tip: "Brust raus, zum Schlüsselbein ziehen, Ellbogen nach unten-hinten denken.",
    hit: "Ergonomischer vertikaler Zug für maximale Lat-Kontraktion ohne Griffkraft-Limit."
  },
  "low-row": {
    name: "Low Row / Cable Row",
    machine: "Selection",
    target: "Mittlerer Rücken, Trapezius (Tiefe)",
    primary: "ruecken", secondary: ["bizeps", "schultern"],
    step: 2.5,
    tip: "Brust am Polster, Schulterblätter zuerst zusammenziehen, dann Ellbogen nach hinten.",
    hit: "Bruststütze eliminiert Schwungholen vollkommen."
  },
  "pullover": {
    name: "Pullover Machine (oder Kabel)",
    machine: "Selection / Kinesis",
    target: "Isolierter Latissimus-Zug",
    primary: "ruecken", secondary: [],
    step: 2.5,
    tip: "Arme fast gestreckt, Bewegung nur aus der Schulter — Bizeps bleibt außen vor.",
    hit: "Der einzige Lat-Reiz ohne Beteiligung der Armbeuger."
  },
  "rear-delt": {
    name: "Rear Deltoid / Reverse Fly",
    machine: "Selection (Pectoral rückwärts)",
    target: "Hintere Schulter & oberer Rücken",
    primary: "schultern", secondary: ["ruecken"],
    step: 2.5,
    tip: "Leichter starten als gedacht — sauber ohne Trapez-Zucken bis zum Versagen.",
    hit: "Gegenspieler zur Push-Einheit, hält die Schulter gesund."
  },

  "seated-leg-curl": {
    name: "Seated Leg Curl",
    machine: "Selection",
    target: "Beinbeuger (Hamstrings), sitzend",
    primary: "hamstrings", secondary: [],
    step: 2.5,
    tip: "Beckengurt fest anlegen, Fußspitzen angezogen, unten 2 Sekunden ablassen.",
    hit: "Gestreckte Hüfte = maximaler Dehnungsreiz auf die Hamstrings."
  },
  "prone-leg-curl": {
    name: "Prone Leg Curl (liegend)",
    machine: "Selection",
    target: "Hamstrings (alternativer Winkel)",
    primary: "hamstrings", secondary: ["huefte"],
    step: 2.5,
    tip: "Hüfte bleibt am Polster, kein Hohlkreuz — sonst übernimmt der Rücken.",
    hit: "Zweiter Winkel direkt nach dem Seated Curl — trifft die kurzen Köpfe."
  },
  "calf": {
    name: "Calf Machine (sitzend/stehend)",
    machine: "Selection / Leg Press",
    target: "Wadenmuskulatur (Gastrocnemius)",
    primary: "waden", secondary: [],
    step: 5,
    tip: "Volle Dehnung unten, 1 Sekunde Halt oben — kein Wippen.",
    hit: "Waden brauchen die volle Bewegungsamplitude, sonst passiert nichts."
  },
  "rotary-torso": {
    name: "Rotary Torso / Cable Woodchopper",
    machine: "Selection / Kinesis",
    target: "Schräge Bauchmuskeln",
    primary: "bauch", secondary: [],
    step: 2.5,
    tip: "Rotation aus dem Rumpf, Becken bleibt fixiert. Beide Seiten gleich viele Wdh.",
    hit: "Kontrollierte Rotation unter Last — leichter starten als bei geraden Übungen."
  },

  "shoulder-press": {
    name: "Shoulder Press",
    machine: "Selection / Pure Strength",
    target: "Vordere & seitliche Schulter",
    primary: "schultern", secondary: ["trizeps"],
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Schulterhöhe starten. Rippen unten lassen.",
    hit: "Geführter Überkopfdruck — Versagen ohne Ausweichbewegung der Wirbelsäule."
  },
  "lateral-raise": {
    name: "Delts Machine / Lateral Raise",
    machine: "Selection",
    target: "Seitliche Schulter isoliert",
    primary: "schultern", secondary: [],
    step: 2.5,
    tip: "Bis Schulterhöhe, kleiner Finger leicht führend, langsam zurück.",
    hit: "Isolierte Seitschulter — hier zählt sauberes Versagen, nicht das Gewicht."
  },
  "arm-curl": {
    name: "Arm Curl Machine",
    machine: "Selection",
    target: "Bizeps isoliert",
    primary: "bizeps", secondary: [],
    step: 2.5,
    tip: "Oberarme liegen komplett auf dem Polster, unten nicht ganz ablegen.",
    hit: "Feste Oberarmauflage macht Schwungholen unmöglich."
  },
  "triceps-pushdown": {
    name: "Cable Triceps Pushdown",
    machine: "Kinesis / Dual Adjustable Pulley",
    target: "Trizeps isoliert",
    primary: "trizeps", secondary: [],
    step: 2.5,
    tip: "Ellbogen am Rumpf fixiert, unten voll durchstrecken und 1 Sekunde halten.",
    hit: "Kabelzug hält die Spannung über den kompletten Bewegungsweg."
  }
};

// weekday: 0 = Sonntag … 6 = Samstag (wie Date#getDay)
const PROGRAMS = {
  hit5: {
    id: "hit5",
    name: "HIT 5er-Split",
    tagline: "Der Originalplan — Mo / Mi / Fr / Sa / So",
    note: "Jede Muskelgruppe einmal pro Woche. Mit Back-off-Satz kommst du auf 4–6 harte Sätze pro Muskel.",
    days: [
      {
        id: 1, weekday: 1, weekdayName: "Montag", short: "Mo",
        title: "Oberkörper Push", subtitle: "Brust & Trizeps",
        focus: "Brustkompression & Trizeps-Überlastung",
        logic: "Frischer Start nach dem Sonntag/Montag-Wechsel",
        exercises: ["chest-press", "incline-chest-press", "pectoral-fly", "triceps-press"]
      },
      {
        id: 2, weekday: 3, weekdayName: "Mittwoch", short: "Mi",
        title: "Unterkörper A", subtitle: "Oberschenkelvorderseite",
        focus: "Quadriceps & Rumpfstabilität",
        logic: "Fokus Oberschenkelvorderseite",
        exercises: ["leg-press", "leg-extension", "abductor-adductor", "abdominal-crunch"]
      },
      {
        id: 3, weekday: 5, weekdayName: "Freitag", short: "Fr",
        title: "Oberkörper Pull", subtitle: "Rücken & Lat",
        focus: "Latissimus-Breite & Rückentiefe",
        logic: "Rücken & hintere Schulter (kein Bein-Stress)",
        exercises: ["vertical-traction", "low-row", "pullover", "rear-delt"]
      },
      {
        id: 4, weekday: 6, weekdayName: "Samstag", short: "Sa",
        title: "Unterkörper B", subtitle: "Beinrückseite & Waden",
        focus: "Hamstrings, Po & Waden",
        logic: "Isolierte Beinrückseite & Waden",
        exercises: ["seated-leg-curl", "prone-leg-curl", "calf", "rotary-torso"]
      },
      {
        id: 5, weekday: 0, weekdayName: "Sonntag", short: "So",
        title: "Schultern & Arme", subtitle: "Spezial-Finish",
        focus: "Seitliche/vordere Schulter & Arme",
        logic: "Isoliertes Finish vor dem Pausentag",
        exercises: ["shoulder-press", "lateral-raise", "arm-curl", "triceps-pushdown"]
      }
    ],
    restDays: {
      2: { weekdayName: "Dienstag", short: "Di", logic: "ZNS-Erholung vor dem Beintag" },
      4: { weekdayName: "Donnerstag", short: "Do", logic: "Vollständige Erholung vor dem 3er-Block" }
    }
  },

  hybrid4: {
    id: "hybrid4",
    name: "HIT-Hybrid 4er",
    tagline: "Jede Muskelgruppe zweimal pro Woche — Mo / Di / Do / Fr",
    note: "Gleiche Geräte, gleiche HIT-Intensität, nur anders verteilt. Mit Back-off-Satz landest du bei 8–12 harten Sätzen pro Muskel.",
    days: [
      {
        id: 1, weekday: 1, weekdayName: "Montag", short: "Mo",
        title: "Oberkörper A", subtitle: "Druck-Schwerpunkt",
        focus: "Brust, Schulter, Rücken — schwerer Einstieg in die Woche",
        logic: "Erste von zwei Oberkörper-Einheiten",
        exercises: ["chest-press", "vertical-traction", "shoulder-press", "low-row", "triceps-press", "arm-curl"]
      },
      {
        id: 2, weekday: 2, weekdayName: "Dienstag", short: "Di",
        title: "Unterkörper A", subtitle: "Quad-Schwerpunkt",
        focus: "Oberschenkelvorderseite, Waden & Bauch",
        logic: "Beine direkt nach dem Oberkörper — Mittwoch bleibt frei",
        exercises: ["leg-press", "leg-extension", "seated-leg-curl", "calf", "abdominal-crunch"]
      },
      {
        id: 3, weekday: 4, weekdayName: "Donnerstag", short: "Do",
        title: "Oberkörper B", subtitle: "Zug- & Schulter-Schwerpunkt",
        focus: "Zweiter Winkel auf Brust und Rücken, isolierte Schultern",
        logic: "Zweite Oberkörper-Einheit nach einem Ruhetag",
        exercises: ["incline-chest-press", "pullover", "lateral-raise", "rear-delt", "pectoral-fly", "triceps-pushdown"]
      },
      {
        id: 4, weekday: 5, weekdayName: "Freitag", short: "Fr",
        title: "Unterkörper B", subtitle: "Hamstring-Schwerpunkt",
        focus: "Beinrückseite, Hüfte, Waden & schräger Bauch",
        logic: "Zweite Bein-Einheit, danach zwei Tage Pause",
        exercises: ["prone-leg-curl", "leg-press", "abductor-adductor", "calf", "rotary-torso"]
      }
    ],
    restDays: {
      3: { weekdayName: "Mittwoch", short: "Mi", logic: "Erholung zwischen den beiden Blöcken" },
      6: { weekdayName: "Samstag", short: "Sa", logic: "Wochenende frei — Superkompensation" },
      0: { weekdayName: "Sonntag", short: "So", logic: "Zweiter Ruhetag vor dem Wochenstart" }
    }
  }
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo … So

// Zielkorridor harter Sätze je Muskel und Woche aus den Volumen-Meta-Analysen.
const VOLUME_TARGET = { min: 10, max: 20, scaleMax: 20 };

const EVIDENCE = [
  {
    claim: "Mehrere harte Sätze schlagen den einen Satz",
    detail: "Rund 40 % größere Effektstärken für Mehrsatz-Training (0,24 bei 1 Satz → 0,34 bei 2–3 → 0,44 bei 4–6).",
    source: "Krieger, J Strength Cond Res 2010"
  },
  {
    claim: "Der Zuwachs steigt mit dem Wochenvolumen",
    detail: "Etwa +0,24 % Muskelwachstum je zusätzlichem Wochensatz, gerechnet bei rund 12 Sätzen pro Muskel. Für Kraft flacht die Kurve viel früher ab.",
    source: "Pelland et al., Sports Medicine 2024/25"
  },
  {
    claim: "Echtes Muskelversagen ist nicht nötig",
    detail: "0–3 Wiederholungen in Reserve bringen praktisch denselben Aufbau, sind für Kraft eher besser und sparen 24–48 h Erholung.",
    source: "Refalo et al. 2023; Vieira et al. 2021"
  },
  {
    claim: "Frequenz zählt, weil sie Volumen ermöglicht",
    detail: "Bei gleichem Wochenvolumen ist die Aufteilung fast egal — über zwei Einheiten bekommst du die Sätze aber leichter unter.",
    source: "Schoenfeld et al. 2019"
  },
  {
    claim: "Rest-Pause ist ein Zeitspar-Werkzeug",
    detail: "Spezialtechniken liegen nur knapp vor klassischem Mehrsatz-Training (g = 0,16) — ihr Wert liegt im Reiz pro Minute.",
    source: "Tsartsapakis et al., J Funct Morphol Kinesiol 2026"
  }
];

window.TG = { RAMP, EXTRA_SETS, MUSCLES, EXERCISES, PROGRAMS, WEEK_ORDER, VOLUME_TARGET, EVIDENCE };
