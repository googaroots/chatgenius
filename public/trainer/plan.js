/**
 * Technogym HIT 5er-Split — Plandaten
 * Quelle: Trainingsplan "Technogym HIT 5er-Split"
 * (High Intensity Training, Max. Belastung 6–8 Wdh. bis zum Muskelversagen, Mo/Mi/Fr/Sa/So)
 */

// Satz-Struktur pro Übung: 3 Aufwärmsätze rampen auf das eine Top-Set hoch.
const RAMP = [
  { nr: 1, label: "Aufwärmen",    pct: 0.50, reps: "10–12", hint: "Locker, nur Blutfluss & Technik", rest: 60 },
  { nr: 2, label: "Vorbereitung", pct: 0.70, reps: "5–6",   hint: "Ohne Reiz — kein Ausbelasten",    rest: 90 },
  { nr: 3, label: "Aktivierung",  pct: 0.85, reps: "2–3",   hint: "ZNS-Fokus, explosiv drücken",     rest: 150 },
  { nr: 4, label: "TOP SET",      pct: 1.00, reps: "6–8",   hint: "Bis zum Muskelversagen",          rest: 180, top: true }
];

// step = Gewichtssprung beim Progressions-Vorschlag und Rundung der Aufwärmsätze (kg).
const EXERCISES = {
  "chest-press": {
    name: "Chest Press",
    machine: "Selection / Pure Strength",
    target: "Ganze Brust, vordere Schulter",
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Höhe der unteren Brust liegen. Schulterblätter fest an die Lehne.",
    hit: "Geführte Trajektorie — sicheres Muskelversagen im Top-Set auch ohne Spotter."
  },
  "incline-chest-press": {
    name: "Incline Chest Press",
    machine: "Selection / Pure Strength",
    target: "Obere Brust (Schlüsselbein)",
    step: 2.5,
    tip: "Ellbogen ca. 45° zum Körper, am Ende nicht komplett durchstrecken.",
    hit: "Schräger Winkel trifft die schlüsselbeinnahen Fasern, die die Flat Press auslässt."
  },
  "pectoral-fly": {
    name: "Pectoral Machine / Cable Fly",
    machine: "Selection",
    target: "Isolierter Brust-Stretch & Squeeze",
    step: 2.5,
    tip: "Ellbogen leicht gebeugt fixieren, 1 Sekunde in der Endkontraktion halten.",
    hit: "Reine Adduktion ohne Trizeps — der Brustmuskel versagt zuerst."
  },
  "triceps-press": {
    name: "Triceps Press / Dip Machine",
    machine: "Selection",
    target: "Trizeps (Masse & Gesamtkraft)",
    step: 2.5,
    tip: "Oberkörper aufrecht, Ellbogen dicht am Rumpf führen.",
    hit: "Mehrgelenkig — erlaubt echte Maximallast auf den Trizeps."
  },

  "leg-press": {
    name: "Leg Press",
    machine: "Selection / Pure Strength",
    target: "Gesamte Beinmuskulatur, Quads",
    step: 5,
    tip: "Füße schulterbreit mittig, Knie in Fußrichtung, unterer Rücken bleibt am Polster.",
    hit: "Extreme Beinbelastung ohne axiale Stauchung der Wirbelsäule."
  },
  "leg-extension": {
    name: "Leg Extension",
    machine: "Selection",
    target: "Isolierter Beinstrecker (Quad-Peak)",
    step: 2.5,
    tip: "Drehachse auf Kniehöhe einstellen, oben kurz halten, langsam ablassen.",
    hit: "Volle Quad-Isolation — perfekt zum Nachbrennen nach der Leg Press."
  },
  "abductor-adductor": {
    name: "Abductor / Adductor",
    machine: "Selection",
    target: "Hüftstabilisatoren & Innenseite",
    step: 2.5,
    tip: "Beide Geräte im Wechsel: erst Abductor (außen), dann Adductor (innen).",
    hit: "Stabilisiert die Hüfte und schützt die Knie bei schweren Top-Sets."
  },
  "abdominal-crunch": {
    name: "Abdominal Crunch",
    machine: "Selection",
    target: "Gerade Bauchmuskeln",
    step: 2.5,
    tip: "Bewegung aus der Bauchmuskulatur, nicht aus den Armen. Ausatmen beim Einrollen.",
    hit: "Bauch lässt sich hier genauso progressiv belasten wie jedes andere Muskel."
  },

  "vertical-traction": {
    name: "Vertical Traction / Lat Machine",
    machine: "Selection",
    target: "Latissimus Dorsi (Rückenbreite)",
    step: 2.5,
    tip: "Brust raus, zum Schlüsselbein ziehen, Ellbogen nach unten-hinten denken.",
    hit: "Ergonomischer vertikaler Zug für maximale Lat-Kontraktion ohne Griffkraft-Limit."
  },
  "low-row": {
    name: "Low Row / Cable Row",
    machine: "Selection",
    target: "Mittlerer Rücken, Trapezius (Tiefe)",
    step: 2.5,
    tip: "Brust am Polster, Schulterblätter zuerst zusammenziehen, dann Ellbogen nach hinten.",
    hit: "Bruststütze eliminiert Schwungholen vollkommen."
  },
  "pullover": {
    name: "Pullover Machine (oder Kabel)",
    machine: "Selection / Kinesis",
    target: "Isolierter Latissimus-Zug",
    step: 2.5,
    tip: "Arme fast gestreckt, Bewegung nur aus der Schulter — Bizeps bleibt außen vor.",
    hit: "Der einzige Lat-Reiz ohne Beteiligung der Armbeuger."
  },
  "rear-delt": {
    name: "Rear Deltoid / Reverse Fly",
    machine: "Selection (Pectoral rückwärts)",
    target: "Hintere Schulter & oberer Rücken",
    step: 2.5,
    tip: "Leichter starten als gedacht — sauber ohne Trapez-Zucken bis zum Versagen.",
    hit: "Gegenspieler zur Push-Einheit, hält die Schulter gesund."
  },

  "seated-leg-curl": {
    name: "Seated Leg Curl",
    machine: "Selection",
    target: "Beinbeuger (Hamstrings), sitzend",
    step: 2.5,
    tip: "Beckengurt fest anlegen, Fußspitzen angezogen, unten 2 Sekunden ablassen.",
    hit: "Gestreckte Hüfte = maximaler Dehnungsreiz auf die Hamstrings."
  },
  "prone-leg-curl": {
    name: "Prone Leg Curl (liegend)",
    machine: "Selection",
    target: "Hamstrings (alternativer Winkel)",
    step: 2.5,
    tip: "Hüfte bleibt am Polster, kein Hohlkreuz — sonst übernimmt der Rücken.",
    hit: "Zweiter Winkel direkt nach dem Seated Curl — trifft die kurzen Köpfe."
  },
  "calf": {
    name: "Calf Machine (sitzend/stehend)",
    machine: "Selection / Leg Press",
    target: "Wadenmuskulatur (Gastrocnemius)",
    step: 5,
    tip: "Volle Dehnung unten, 1 Sekunde Halt oben — kein Wippen.",
    hit: "Waden brauchen die volle Bewegungsamplitude, sonst passiert nichts."
  },
  "rotary-torso": {
    name: "Rotary Torso / Cable Woodchopper",
    machine: "Selection / Kinesis",
    target: "Schräge Bauchmuskeln",
    step: 2.5,
    tip: "Rotation aus dem Rumpf, Becken bleibt fixiert. Beide Seiten gleich viele Wdh.",
    hit: "Kontrollierte Rotation unter Last — leichter starten als bei geraden Übungen."
  },

  "shoulder-press": {
    name: "Shoulder Press",
    machine: "Selection / Pure Strength",
    target: "Vordere & seitliche Schulter",
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Schulterhöhe starten. Rippen unten lassen.",
    hit: "Geführter Überkopfdruck — Versagen ohne Ausweichbewegung der Wirbelsäule."
  },
  "lateral-raise": {
    name: "Delts Machine / Lateral Raise",
    machine: "Selection",
    target: "Seitliche Schulter isoliert",
    step: 2.5,
    tip: "Bis Schulterhöhe, kleiner Finger leicht führend, langsam zurück.",
    hit: "Isolierte Seitschulter — hier zählt sauberes Versagen, nicht das Gewicht."
  },
  "arm-curl": {
    name: "Arm Curl Machine",
    machine: "Selection",
    target: "Bizeps isoliert",
    step: 2.5,
    tip: "Oberarme liegen komplett auf dem Polster, unten nicht ganz ablegen.",
    hit: "Feste Oberarmauflage macht Schwungholen unmöglich."
  },
  "triceps-pushdown": {
    name: "Cable Triceps Pushdown",
    machine: "Kinesis / Dual Adjustable Pulley",
    target: "Trizeps isoliert",
    step: 2.5,
    tip: "Ellbogen am Rumpf fixiert, unten voll durchstrecken und 1 Sekunde halten.",
    hit: "Kabelzug hält die Spannung über den kompletten Bewegungsweg."
  }
};

// weekday: 0 = Sonntag … 6 = Samstag (wie Date#getDay)
const DAYS = [
  {
    id: 1, weekday: 1, weekdayName: "Montag", short: "Mo",
    title: "Oberkörper Push",
    subtitle: "Brust & Trizeps",
    focus: "Brustkompression & Trizeps-Überlastung",
    logic: "Frischer Start nach dem Sonntag/Montag-Wechsel",
    exercises: ["chest-press", "incline-chest-press", "pectoral-fly", "triceps-press"]
  },
  {
    id: 2, weekday: 3, weekdayName: "Mittwoch", short: "Mi",
    title: "Unterkörper A",
    subtitle: "Oberschenkelvorderseite",
    focus: "Quadriceps & Rumpfstabilität",
    logic: "Fokus Oberschenkelvorderseite",
    exercises: ["leg-press", "leg-extension", "abductor-adductor", "abdominal-crunch"]
  },
  {
    id: 3, weekday: 5, weekdayName: "Freitag", short: "Fr",
    title: "Oberkörper Pull",
    subtitle: "Rücken & Lat",
    focus: "Latissimus-Breite & Rückentiefe",
    logic: "Rücken & hintere Schulter (kein Bein-Stress)",
    exercises: ["vertical-traction", "low-row", "pullover", "rear-delt"]
  },
  {
    id: 4, weekday: 6, weekdayName: "Samstag", short: "Sa",
    title: "Unterkörper B",
    subtitle: "Beinrückseite & Waden",
    focus: "Hamstrings, Po & Waden",
    logic: "Isolierte Beinrückseite & Waden",
    exercises: ["seated-leg-curl", "prone-leg-curl", "calf", "rotary-torso"]
  },
  {
    id: 5, weekday: 0, weekdayName: "Sonntag", short: "So",
    title: "Schultern & Arme",
    subtitle: "Spezial-Finish",
    focus: "Seitliche/vordere Schulter & Arme",
    logic: "Isoliertes Finish vor dem Pausentag",
    exercises: ["shoulder-press", "lateral-raise", "arm-curl", "triceps-pushdown"]
  }
];

const REST_DAYS = {
  2: { weekdayName: "Dienstag", short: "Di", logic: "ZNS-Erholung vor dem Beintag" },
  4: { weekdayName: "Donnerstag", short: "Do", logic: "Vollständige Erholung vor dem 3er-Block" }
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo … So

window.TG = { RAMP, EXERCISES, DAYS, REST_DAYS, WEEK_ORDER };
