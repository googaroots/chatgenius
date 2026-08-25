/**
 * Trainingsdaten — evidenzbasiertes Programm für Technogym-Geräte.
 *
 * Aufbau nach den Volumen- und Ausbelastungs-Meta-Analysen (siehe EVIDENCE):
 * jede Muskelgruppe zweimal pro Woche, 2–3 Arbeitssätze je Übung mit 1–2
 * Wiederholungen in Reserve, zusammen 10–14 harte Sätze je Muskel und Woche.
 */

// Aufwärmsätze: kurz und ohne Ermüdung — sie zählen nicht ins harte Volumen.
const WARMUP = [
  { pct: 0.50, reps: "8", label: "Aufwärmen",  hint: "Locker, nur Blutfluss & Technik", rest: 45 },
  { pct: 0.75, reps: "4", label: "Steigerung", hint: "Ein Vorgeschmack, ohne Reiz",     rest: 60 }
];

const REST = { compound: 150, isolation: 90 };

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

// step = Gewichtssprung für den Progressions-Vorschlag und die Rundung der Aufwärmsätze.
// primary zählt voll ins Wochenvolumen, secondary zur Hälfte.
const EXERCISES = {
  "chest-press": {
    name: "Chest Press",
    machine: "Selection / Pure Strength",
    target: "Ganze Brust, vordere Schulter",
    primary: "brust", secondary: ["trizeps", "schultern"], compound: true,
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Höhe der unteren Brust liegen. Schulterblätter fest an die Lehne.",
    why: "Geführter Druck mit voller Last — der beste Reiz für Brustmasse ohne Spotter."
  },
  "incline-chest-press": {
    name: "Incline Chest Press",
    machine: "Selection / Pure Strength",
    target: "Obere Brust (Schlüsselbein)",
    primary: "brust", secondary: ["schultern", "trizeps"], compound: true,
    step: 2.5,
    tip: "Ellbogen ca. 45° zum Körper, am Ende nicht komplett durchstrecken.",
    why: "Zweiter Winkel in der Woche — trifft die Fasern, die die flache Presse auslässt."
  },
  "pectoral-fly": {
    name: "Pectoral Machine / Cable Fly",
    machine: "Selection",
    target: "Brust in voller Dehnung",
    primary: "brust", secondary: [], compound: false,
    step: 2.5,
    tip: "Ellbogen leicht gebeugt fixieren, in der Dehnung kurz halten.",
    why: "Belastung im gedehnten Bereich — dort wächst der Muskel besonders gut."
  },
  "triceps-press": {
    name: "Triceps Press / Dip Machine",
    machine: "Selection",
    target: "Trizeps (alle Köpfe)",
    primary: "trizeps", secondary: ["brust"], compound: true,
    step: 2.5,
    tip: "Oberkörper aufrecht, Ellbogen dicht am Rumpf führen.",
    why: "Mehrgelenkig — erlaubt mehr Last als jede Isolationsübung."
  },
  "triceps-pushdown": {
    name: "Cable Triceps Pushdown",
    machine: "Kinesis / Dual Adjustable Pulley",
    target: "Trizeps isoliert",
    primary: "trizeps", secondary: [], compound: false,
    step: 2.5,
    tip: "Ellbogen am Rumpf fixiert, unten voll durchstrecken und 1 Sekunde halten.",
    why: "Kabelzug hält die Spannung über den kompletten Bewegungsweg."
  },

  "leg-press": {
    name: "Leg Press",
    machine: "Selection / Pure Strength",
    target: "Quadrizeps, Gesäß, Beinrückseite",
    primary: "quads", secondary: ["huefte", "hamstrings"], compound: true,
    step: 5,
    tip: "Füße schulterbreit mittig, Knie in Fußrichtung, unterer Rücken bleibt am Polster.",
    why: "Schwere Beinlast ohne Stauchung der Wirbelsäule — die Basis beider Beintage."
  },
  "leg-press-high": {
    name: "Leg Press (Füße hoch)",
    machine: "Selection / Pure Strength",
    target: "Gesäß & Beinrückseite",
    primary: "huefte", secondary: ["hamstrings", "quads"], compound: true,
    step: 5,
    tip: "Füße höher und etwas breiter aufsetzen, tief herunterlassen — Hüfte macht die Arbeit.",
    why: "Gleiches Gerät, anderer Winkel: verschiebt die Last auf Gesäß und Hamstrings."
  },
  "leg-extension": {
    name: "Leg Extension",
    machine: "Selection",
    target: "Quadrizeps isoliert",
    primary: "quads", secondary: [], compound: false,
    step: 2.5,
    tip: "Drehachse auf Kniehöhe einstellen, oben kurz halten, langsam ablassen.",
    why: "Die einzige Übung, die den geraden Oberschenkelmuskel voll trifft."
  },
  "seated-leg-curl": {
    name: "Seated Leg Curl",
    machine: "Selection",
    target: "Hamstrings, sitzend",
    primary: "hamstrings", secondary: [], compound: false,
    step: 2.5,
    tip: "Beckengurt fest anlegen, Fußspitzen angezogen, unten 2 Sekunden ablassen.",
    why: "Sitzend ist die Hüfte gebeugt und der zweigelenkige Beinbeuger gedehnt — im Direktvergleich (ein Bein sitzend, eins liegend, 12 Wochen) wuchs er sitzend deutlich stärker (Maeo et al. 2021).",
    alt: "Wenn das Gerät besetzt ist: liegender Leg Curl — derselbe Muskel, nur schwächerer Reiz."
  },
  "prone-leg-curl": {
    name: "Prone Leg Curl (liegend)",
    machine: "Selection",
    target: "Hamstrings, liegend",
    primary: "hamstrings", secondary: ["waden"], compound: false,
    step: 2.5,
    tip: "Hüfte bleibt am Polster, kein Hohlkreuz — sonst übernimmt der Rücken.",
    why: "Ausweichübung: gestreckte Hüfte trifft den kurzen Bizepskopf, bringt aber weniger Gesamtwachstum als der sitzende Curl."
  },
  "glute": {
    name: "Glute Machine",
    machine: "Selection",
    target: "Gesäßmuskulatur",
    primary: "huefte", secondary: ["hamstrings"], compound: false,
    step: 5,
    tip: "Standbein leicht gebeugt, Bewegung nur aus der Hüfte — oben 1 Sekunde halten, kein Hohlkreuz.",
    why: "Die einzige Übung im Plan, die das Gesäß direkt und in voller Streckung belastet."
  },
  "overhead-triceps": {
    name: "Trizeps-Strecken über Kopf (Kabel)",
    machine: "Kinesis / Dual Adjustable Pulley",
    target: "Trizeps, besonders der lange Kopf",
    primary: "trizeps", secondary: [], compound: false,
    step: 2.5,
    tip: "Zug von unten, Ellbogen eng am Kopf und hoch fixiert, tief hinter den Kopf ablassen.",
    why: "Über Kopf ist der lange Trizepskopf gedehnt — im direkten Vergleich über 12 Wochen wuchs der Trizeps dort deutlich stärker als beim Pushdown (Maeo et al. 2023).",
    alt: "Wenn der Kabelturm besetzt ist: Pushdown, aber mit weiter oben fixierten Ellbogen."
  },
  "cable-curl-behind": {
    name: "Kabel-Curl mit Arm hinter dem Körper",
    machine: "Kinesis / Dual Adjustable Pulley",
    target: "Bizeps in gedehnter Position",
    primary: "bizeps", secondary: [], compound: false,
    step: 2.5,
    tip: "Unterste Zugposition, einen Schritt vor das Gerät, Oberarm bleibt hinter der Körperlinie.",
    why: "Schulter in Streckung dehnt den zweigelenkigen Bizeps — wächst dort oben stärker, während die Arm-Curl-Maschine eher den unteren Teil trifft (Kassiano et al. 2025).",
    alt: "Alternativ Kurzhantel-Curl auf der Schrägbank."
  },
  "abductor-adductor": {
    name: "Abductor / Adductor",
    machine: "Selection",
    target: "Hüftstabilisatoren & Innenseite",
    primary: "huefte", secondary: [], compound: false,
    step: 2.5,
    tip: "Beide Geräte im Wechsel: erst Abductor (außen), dann Adductor (innen).",
    why: "Hält die Hüfte stabil und die Knie gesund, wenn die Leg Press schwerer wird."
  },
  "calf": {
    name: "Wadenheben stehend",
    machine: "Selection Calf / Leg Press",
    target: "Wadenmuskulatur (Zwillingswadenmuskel)",
    primary: "waden", secondary: [], compound: false,
    step: 5,
    tip: "Knie fast gestreckt, volle Dehnung unten, 1 Sekunde Halt oben — kein Wippen.",
    why: "Mit gestrecktem Knie ist der zweigelenkige Zwillingswadenmuskel unter Spannung: stehend wuchs die Wade über 12 Wochen klar stärker als sitzend (Kinoshita et al. 2023).",
    alt: "Auch an der Leg Press machbar: Fußballen an die Plattformkante, Beine fast gestreckt."
  },

  "vertical-traction": {
    name: "Vertical Traction / Lat Machine",
    machine: "Selection",
    target: "Latissimus (Rückenbreite)",
    primary: "ruecken", secondary: ["bizeps"], compound: true,
    step: 2.5,
    tip: "Brust raus, zum Schlüsselbein ziehen, Ellbogen nach unten-hinten denken.",
    why: "Vertikaler Zug für die Breite — das Gegenstück zum Drücken."
  },
  "low-row": {
    name: "Low Row / Cable Row",
    machine: "Selection",
    target: "Mittlerer Rücken, Trapez",
    primary: "ruecken", secondary: ["bizeps", "schultern"], compound: true,
    step: 2.5,
    tip: "Brust am Polster, Schulterblätter zuerst zusammenziehen, dann Ellbogen nach hinten.",
    why: "Horizontaler Zug für die Dichte — die Bruststütze verhindert Schwungholen."
  },
  "pullover": {
    name: "Pullover Machine (oder Kabel)",
    machine: "Selection / Kinesis",
    target: "Latissimus isoliert",
    primary: "ruecken", secondary: [], compound: false,
    step: 2.5,
    tip: "Arme fast gestreckt, Bewegung nur aus der Schulter — Bizeps bleibt außen vor.",
    why: "Lat-Reiz ohne Armbeuger als Schwachstelle."
  },
  "shoulder-press": {
    name: "Shoulder Press",
    machine: "Selection / Pure Strength",
    target: "Vordere & seitliche Schulter",
    primary: "schultern", secondary: ["trizeps"], compound: true,
    step: 2.5,
    tip: "Sitzhöhe so, dass die Griffe auf Schulterhöhe starten. Rippen unten lassen.",
    why: "Geführter Überkopfdruck — schwere Last ohne Ausweichbewegung."
  },
  "lateral-raise": {
    name: "Delts Machine / Lateral Raise",
    machine: "Selection",
    target: "Seitliche Schulter",
    primary: "schultern", secondary: [], compound: false,
    step: 2.5,
    tip: "Bis Schulterhöhe, kleiner Finger leicht führend, langsam zurück.",
    why: "Die seitliche Schulter wächst fast nur über hohe Wiederholungszahlen."
  },
  "rear-delt": {
    name: "Rear Deltoid / Reverse Fly",
    machine: "Selection (Pectoral rückwärts)",
    target: "Hintere Schulter & oberer Rücken",
    primary: "schultern", secondary: ["ruecken"], compound: false,
    step: 2.5,
    tip: "Leichter starten als gedacht — sauber ohne Trapez-Zucken.",
    why: "Gegenspieler zum vielen Drücken, hält die Schulter gesund."
  },
  "arm-curl": {
    name: "Arm Curl Machine",
    machine: "Selection",
    target: "Bizeps",
    primary: "bizeps", secondary: [], compound: false,
    step: 2.5,
    tip: "Oberarme liegen komplett auf dem Polster, unten nicht ganz ablegen.",
    why: "Feste Oberarmauflage macht Schwungholen unmöglich."
  },

  "abdominal-crunch": {
    name: "Abdominal Crunch",
    machine: "Selection",
    target: "Gerade Bauchmuskeln",
    primary: "bauch", secondary: [], compound: false,
    step: 2.5,
    tip: "Bewegung aus der Bauchmuskulatur, nicht aus den Armen. Ausatmen beim Einrollen.",
    why: "Der Bauch reagiert auf progressive Last wie jeder andere Muskel."
  },
  "rotary-torso": {
    name: "Rotary Torso / Cable Woodchopper",
    machine: "Selection / Kinesis",
    target: "Schräge Bauchmuskeln",
    primary: "bauch", secondary: [], compound: false,
    step: 2.5,
    tip: "Rotation aus dem Rumpf, Becken bleibt fixiert. Beide Seiten gleich viele Wdh.",
    why: "Deckt die Rotation ab, die Crunches auslassen."
  }
};

// ramp: true → vor dieser Übung die zwei Aufwärmsätze (erste Übung je Körperregion).
const PROGRAM = {
  id: "eb4",
  name: "Evidenz-4er",
  tagline: "Oberkörper / Unterkörper — Mo / Di / Do / Fr",
  note: "Jede Muskelgruppe zweimal pro Woche, 2–3 Arbeitssätze je Übung, 7–14 harte Sätze je Muskel.",
  days: [
    {
      id: 1, weekday: 1, weekdayName: "Montag", short: "Mo",
      title: "Oberkörper A", subtitle: "Schwere Grundübungen",
      focus: "Brust, Rücken und Schultern im unteren Wiederholungsbereich",
      logic: "Frisch in die Woche — hier liegen die schwersten Sätze",
      exercises: [
        { id: "chest-press",       sets: 3, min: 6,  max: 8,  ramp: true },
        { id: "vertical-traction", sets: 3, min: 8,  max: 10, ramp: true },
        { id: "shoulder-press",    sets: 3, min: 8,  max: 10 },
        { id: "low-row",           sets: 3, min: 8,  max: 12 },
        { id: "arm-curl",          sets: 3, min: 10, max: 15 },
        { id: "overhead-triceps",  sets: 2, min: 10, max: 15 }
      ]
    },
    {
      id: 2, weekday: 2, weekdayName: "Dienstag", short: "Di",
      title: "Unterkörper A", subtitle: "Quadrizeps-Schwerpunkt",
      focus: "Oberschenkelvorderseite, Beinbeuger, Waden und Bauch (gerade & schräg)",
      logic: "Beine direkt nach dem Oberkörper — der Mittwoch bleibt frei",
      exercises: [
        { id: "leg-press",       sets: 3, min: 8,  max: 12, ramp: true },
        { id: "leg-extension",   sets: 3, min: 10, max: 15 },
        { id: "seated-leg-curl", sets: 3, min: 8,  max: 12, ramp: true },
        { id: "calf",            sets: 3, min: 10, max: 15 },
        { id: "abdominal-crunch", sets: 3, min: 10, max: 15 },
        { id: "rotary-torso",     sets: 2, min: 12, max: 15 }
      ]
    },
    {
      id: 3, weekday: 4, weekdayName: "Donnerstag", short: "Do",
      title: "Oberkörper B", subtitle: "Zweiter Winkel, mehr Wiederholungen",
      focus: "Obere Brust, Latissimus und die kleinen Schulterköpfe",
      logic: "Zweiter Reiz auf dieselben Muskeln, moderater und mit mehr Volumen",
      exercises: [
        { id: "incline-chest-press", sets: 3, min: 8,  max: 12, ramp: true },
        { id: "pullover",            sets: 3, min: 10, max: 12, ramp: true },
        { id: "lateral-raise",       sets: 3, min: 12, max: 15 },
        { id: "rear-delt",           sets: 3, min: 12, max: 15 },
        { id: "pectoral-fly",        sets: 2, min: 12, max: 15 },
        { id: "triceps-press",       sets: 2, min: 10, max: 12 },
        { id: "cable-curl-behind",   sets: 2, min: 10, max: 15 }
      ]
    },
    {
      id: 4, weekday: 5, weekdayName: "Freitag", short: "Fr",
      title: "Unterkörper B", subtitle: "Beinrückseite & Hüfte",
      focus: "Hamstrings, Gesäß direkt, Hüfte und Waden",
      logic: "Zweite Bein-Einheit, danach zwei Tage Pause",
      exercises: [
        { id: "seated-leg-curl",    sets: 3, min: 8,  max: 12, ramp: true },
        { id: "leg-press-high",     sets: 3, min: 10, max: 15, ramp: true },
        { id: "glute",              sets: 2, min: 10, max: 15 },
        { id: "abductor-adductor",  sets: 2, min: 12, max: 15 },
        { id: "calf",               sets: 4, min: 10, max: 15 },
        { id: "leg-extension",      sets: 2, min: 12, max: 15 },
        { id: "rotary-torso",       sets: 2, min: 12, max: 15 }
      ]
    }
  ],
  restDays: {
    3: { weekdayName: "Mittwoch", short: "Mi", logic: "Erholung zwischen den beiden Blöcken" },
    6: { weekdayName: "Samstag", short: "Sa", logic: "Wochenende frei — hier wächst der Muskel" },
    0: { weekdayName: "Sonntag", short: "So", logic: "Zweiter Ruhetag vor dem Wochenstart" }
  }
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo … So

// Zielkorridor harter Sätze je Muskel und Woche aus den Volumen-Meta-Analysen.
const VOLUME_TARGET = { min: 10, max: 20, scaleMax: 20 };

const EVIDENCE = [
  {
    claim: "2–3 Arbeitssätze je Übung statt einem",
    detail: "Mehrsatz-Training zeigt rund 40 % größere Effektstärken beim Muskelwachstum (0,24 bei 1 Satz → 0,34 bei 2–3 → 0,44 bei 4–6).",
    source: "Krieger, J Strength Cond Res 2010"
  },
  {
    claim: "10–20 harte Sätze je Muskel und Woche",
    detail: "Etwa +0,24 % Muskelwachstum je zusätzlichem Wochensatz, gerechnet bei rund 12 Sätzen. Für Kraft flacht die Kurve viel früher ab als für Größe.",
    source: "Pelland et al., Sports Medicine 2024/25"
  },
  {
    claim: "1–2 Wiederholungen in Reserve statt Versagen",
    detail: "Praktisch derselbe Muskelaufbau, tendenziell bessere Kraftwerte und 24–48 Stunden kürzere Erholung.",
    source: "Refalo et al. 2023; Vieira et al. 2021"
  },
  {
    claim: "Jede Muskelgruppe zweimal pro Woche",
    detail: "Bei gleichem Wochenvolumen ist die Aufteilung fast egal — über zwei Einheiten bekommst du die Sätze aber leichter unter und trainierst jeden Satz frischer.",
    source: "Schoenfeld et al. 2019"
  },
  {
    claim: "Übungen in gedehnter Position bevorzugen",
    detail: "Sitzender Beinbeuger statt liegend, Trizeps über Kopf statt Pushdown, Wadenheben stehend statt sitzend — in direkten Vergleichsstudien wuchs jeweils die gedehnte Variante deutlich stärker.",
    source: "Maeo et al. 2021 & 2023; Kinoshita et al. 2023"
  },
  {
    claim: "Zwei Winkel je Muskel, nicht zwei Namen",
    detail: "Schrägdrücken trifft die obere Brust, die die flache Presse auslässt; die Leg Extension trifft den geraden Oberschenkelmuskel, den Beinpressen kaum erreichen; Preacher- und Kabel-Curl treffen verschiedene Abschnitte des Bizeps.",
    source: "Chaves et al. 2020; Kassiano et al. 2025; Vergleich Kniestrecker 2025"
  },
  {
    claim: "6 bis 15 Wiederholungen, beides funktioniert",
    detail: "Muskelaufbau gelingt über die ganze Spanne, solange nah genug ans Versagen trainiert wird. Schwere Sätze bringen zusätzlich mehr Maximalkraft.",
    source: "Schoenfeld et al., J Strength Cond Res 2017"
  }
];

window.TG = { WARMUP, REST, MUSCLES, EXERCISES, PROGRAM, WEEK_ORDER, VOLUME_TARGET, EVIDENCE };
