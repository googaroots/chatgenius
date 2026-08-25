/**
 * Piktogramme für die Übungen — eigene SVGs, kein fremdes Bildmaterial.
 *
 * Bildsprache: das Gerät in Rahmen- und Polsterfarbe, der Körper in der
 * Akzentfarbe, die Bewegungsrichtung als gestrichelter Pfeil.
 * Alle Zeichnungen teilen sich die Fläche 0 0 120 90.
 */
(function () {
  "use strict";

  const rect = (cls, x, y, w, h, r) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r === undefined ? 3 : r}"/>`;
  const path = (cls, d) => `<path class="${cls}" d="${d}"/>`;
  const head = (x, y, r) => `<circle class="bh" cx="${x}" cy="${y}" r="${r || 5.5}"/>`;
  const floor = (x1, x2, y) => path("f", `M${x1} ${y === undefined ? 84 : y}H${x2}`);

  /** Gewichtsblock mit Trennlinien. */
  const stack = (x, y, w, h) => {
    w = w || 15; h = h || 38;
    let lines = "";
    for (let i = 1; i * 9 < h; i++) lines += `M${x + 3} ${y + i * 9}h${w - 6}`;
    return rect("p", x, y, w, h, 2) + path("f", lines);
  };

  /** Pfeilspitze: 0° zeigt nach rechts. */
  const tip = (x, y, deg) => `<path class="mh" d="M0 0L-8 -4.5L-8 4.5Z" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  const move = (d) => path("m", d);

  const svg = (inner) => `<svg class="art" viewBox="0 0 120 90" role="img" aria-hidden="true">${inner}</svg>`;

  const ART = {};

  /* ------------------------------------------------------- Drücken sitzend */

  ART["chest-press"] = svg([
    floor(8, 112),
    stack(12, 30),
    path("f", "M27 34h10M32 34v40"),          // Umlenkung zum Hebel
    path("f", "M46 28v22"),                    // Griff senkrecht
    path("f", "M46 40H32"),
    rect("p", 62, 58, 28, 7),                  // Sitz
    rect("p", 88, 28, 7, 32),                  // Rückenlehne
    path("f", "M76 84h20"),
    head(80, 22),
    path("b", "M82 28L85 57"),                 // Rumpf
    path("b", "M85 57L68 62L66 78"),           // Bein
    path("b", "M82 33L66 37L50 36"),           // Arm zum Griff
    move("M60 16H40"),
    tip(38, 16, 180)
  ].join(""));

  ART["incline-chest-press"] = svg([
    floor(8, 112),
    stack(12, 34),
    path("f", "M27 38h8M35 38v36"),
    path("f", "M52 22v20M52 34H35"),
    rect("p", 60, 60, 30, 7),
    `<g transform="rotate(-22 92 58)">${rect("p", 88, 26, 7, 34)}</g>`,
    path("f", "M74 84h22"),
    head(76, 20),
    path("b", "M79 26L88 56"),
    path("b", "M88 56L70 63L67 79"),
    path("b", "M80 31L64 32L54 26"),
    move("M64 14L46 8"),
    tip(44, 7, 198)
  ].join(""));

  ART["shoulder-press"] = svg([
    floor(8, 112),
    stack(96, 28),
    path("f", "M96 32h-8M88 32v40"),
    path("f", "M40 16h30M46 16v8M64 16v8"),    // Griffe über dem Kopf
    rect("p", 46, 60, 28, 7),
    rect("p", 74, 30, 7, 32),
    path("f", "M60 84h22"),
    head(64, 30, 5.5),
    path("b", "M65 36L69 59"),
    path("b", "M69 59L52 64L50 79"),
    path("b", "M64 38L54 32L47 24"),           // Arm nach oben zum Griff
    move("M36 34V16"),
    tip(36, 14, -90)
  ].join(""));

  ART["triceps-press"] = svg([
    floor(8, 112),
    stack(96, 30),
    path("f", "M96 34h-8M88 34v38"),
    rect("p", 46, 58, 28, 7),
    rect("p", 74, 26, 7, 34),
    path("f", "M52 30v22M46 52h12"),           // Griff neben dem Körper
    path("f", "M60 84h22"),
    head(64, 20),
    path("b", "M65 26L69 57"),
    path("b", "M69 57L52 62L50 78"),
    path("b", "M64 30L55 40L53 51"),
    move("M36 34v18"),
    tip(36, 54, 90)
  ].join(""));

  /* --------------------------------------------------- Brust / Schulter frontal */

  const frontBody = (cx) => [
    head(cx, 20),
    path("b", `M${cx} 26v26`),
    rect("p", cx - 12, 52, 24, 8),
    path("f", `M${cx - 10} 84h20M${cx} 60v24`)
  ].join("");

  ART["pectoral-fly"] = svg([
    floor(8, 112),
    path("f", "M24 18v46M96 18v46"),
    rect("p", 20, 22, 9, 26, 3),
    rect("p", 91, 22, 9, 26, 3),
    frontBody(60),
    path("b", "M60 32L38 30"),
    path("b", "M60 32L82 30"),
    move("M34 44Q46 50 56 46"),
    tip(58, 46, 340),
    move("M86 44Q74 50 64 46"),
    tip(62, 46, 200)
  ].join(""));

  ART["rear-delt"] = svg([
    floor(8, 112),
    path("f", "M24 18v46M96 18v46"),
    rect("p", 20, 22, 9, 26, 3),
    rect("p", 91, 22, 9, 26, 3),
    frontBody(60),
    path("b", "M60 32L40 34"),
    path("b", "M60 32L80 34"),
    move("M50 48Q40 52 32 48"),
    tip(30, 47, 200),
    move("M70 48Q80 52 88 48"),
    tip(90, 47, 340)
  ].join(""));

  ART["lateral-raise"] = svg([
    floor(8, 112),
    path("f", "M26 26v40M94 26v40"),
    rect("p", 22, 30, 9, 22, 3),
    rect("p", 89, 30, 9, 22, 3),
    frontBody(60),
    path("b", "M60 32L42 42"),
    path("b", "M60 32L78 42"),
    move("M36 46L28 32"),
    tip(27, 30, 240),
    move("M84 46L92 32"),
    tip(93, 30, 300)
  ].join(""));

  /* -------------------------------------------------------------- Ziehen */

  ART["vertical-traction"] = svg([
    floor(8, 112),
    path("f", "M92 12v62M92 12H40"),
    `<circle class="f" cx="40" cy="14" r="4"/>`,
    stack(84, 34, 15, 38),
    path("f", "M40 18v14M28 32h24M34 32v4M46 32v4"),  // Zuggriff
    rect("p", 30, 60, 30, 7),
    rect("p", 58, 32, 7, 30),
    path("f", "M44 84h22"),
    head(48, 26),
    path("b", "M50 32L54 59"),
    path("b", "M54 59L36 64L34 79"),
    path("b", "M49 34L44 28L41 22"),
    move("M22 20v20"),
    tip(22, 42, 90)
  ].join(""));

  ART["low-row"] = svg([
    floor(8, 112),
    stack(12, 30),
    path("f", "M27 34h8M35 34v40"),
    path("f", "M35 46h18M53 40v12"),           // Kabel zum Griff
    rect("p", 62, 58, 28, 7),
    rect("p", 60, 30, 7, 24),                  // Bruststütze
    path("f", "M76 84h20"),
    head(78, 22),
    path("b", "M79 28L84 57"),
    path("b", "M84 57L68 62L66 78"),
    path("b", "M78 34L66 42L54 46"),
    move("M40 20h20"),
    tip(62, 20, 0)
  ].join(""));

  ART["pullover"] = svg([
    floor(8, 112),
    stack(96, 30),
    path("f", "M96 34h-8M88 34v38"),
    path("f", "M46 24a14 14 0 0 1 24 6"),      // Hebelbogen über dem Kopf
    rect("p", 48, 58, 28, 7),
    rect("p", 76, 28, 7, 32),
    path("f", "M62 84h22"),
    head(66, 22),
    path("b", "M67 28L71 57"),
    path("b", "M71 57L54 62L52 78"),
    path("b", "M66 31L54 26"),
    move("M44 22Q36 34 44 46"),
    tip(46, 48, 60)
  ].join(""));

  ART["arm-curl"] = svg([
    floor(8, 112),
    stack(96, 34),
    path("f", "M96 38h-8M88 38v34"),
    rect("p", 52, 58, 26, 7),
    `<g transform="rotate(-18 52 44)">${rect("p", 38, 40, 30, 7)}</g>`,  // Schrägpolster
    path("f", "M66 84h20"),
    head(70, 24),
    path("b", "M70 30L74 57"),
    path("b", "M74 57L58 62L56 78"),
    path("b", "M69 33L54 40L44 36"),
    move("M36 44Q30 30 42 24"),
    tip(44, 23, 320)
  ].join(""));

  ART["triceps-pushdown"] = svg([
    floor(8, 112),
    path("f", "M30 10v66"),
    `<circle class="f" cx="30" cy="14" r="4"/>`,
    stack(22, 40, 15, 34),
    path("f", "M34 14h30M64 14v18M54 32h20"),  // Kabel und Stange
    head(76, 24),
    path("b", "M77 30L79 56"),
    path("b", "M79 56L74 70L74 82"),
    path("b", "M77 33L70 40L66 34"),
    move("M52 44v16"),
    tip(52, 62, 90)
  ].join(""));

  /* ----------------------------------------------------------------- Beine */

  const legPress = (footY) => svg([
    floor(8, 112),
    path("f", "M16 78L74 30"),                 // Schiene
    path("f", "M16 78h18"),
    `<g transform="rotate(-39 62 34)">${rect("p", 52, 18, 9, 32, 2)}</g>`, // Fußplatte
    stack(92, 34, 15, 38),
    path("f", "M92 38h-6"),
    rect("p", 74, 62, 26, 7),
    rect("p", 98, 34, 7, 30),
    head(88, 28),
    path("b", "M89 34L94 61"),
    path("b", `M94 61L${footY.kneeX} ${footY.kneeY}L${footY.footX} ${footY.footY}`),
    path("b", "M88 38L80 46"),
    move("M40 42L26 54"),
    tip(24, 56, 140)
  ].join(""));

  ART["leg-press"] = legPress({ kneeX: 74, kneeY: 46, footX: 58, footY: 40 });
  ART["leg-press-high"] = legPress({ kneeX: 74, kneeY: 48, footX: 56, footY: 30 });

  ART["leg-extension"] = svg([
    floor(8, 112),
    stack(16, 36),
    path("f", "M31 40h8M39 40v34"),
    rect("p", 54, 56, 28, 7),
    rect("p", 80, 26, 7, 32),
    path("f", "M68 84h20"),
    path("f", "M40 44v18M36 62h10"),           // Beinpolster
    head(72, 20),
    path("b", "M73 26L77 55"),
    path("b", "M77 55L58 58"),                 // Oberschenkel
    path("b", "M58 58L46 62"),                 // Unterschenkel angehoben
    path("b", "M72 30L62 40"),
    move("M44 76Q38 64 46 56"),
    tip(48, 55, 315)
  ].join(""));

  ART["seated-leg-curl"] = svg([
    floor(8, 112),
    stack(16, 34),
    path("f", "M31 38h8M39 38v36"),
    rect("p", 54, 54, 28, 7),
    rect("p", 80, 24, 7, 32),
    rect("p", 50, 34, 24, 6),                  // Beckenpolster
    path("f", "M68 84h20"),
    head(72, 18),
    path("b", "M73 24L77 53"),
    path("b", "M77 53L56 56"),
    path("b", "M56 56L48 70"),                 // Unterschenkel nach unten
    path("b", "M72 28L62 38"),
    move("M40 56Q34 66 44 74"),
    tip(46, 75, 40)
  ].join(""));

  ART["prone-leg-curl"] = svg([
    floor(8, 112),
    stack(96, 36),
    path("f", "M96 40h-8M88 40v34"),
    rect("p", 34, 54, 52, 8),                  // Liegepolster
    path("f", "M44 84h32M50 62v22M74 62v22"),
    head(30, 48),
    path("b", "M36 50L62 52"),                 // Rumpf liegend
    path("b", "M62 52L78 54"),
    path("b", "M78 54L82 38"),                 // Unterschenkel angezogen
    path("f", "M76 36h12"),
    move("M92 60Q98 48 90 38"),
    tip(88, 36, 250)
  ].join(""));

  ART["glute"] = svg([
    floor(8, 112),
    stack(16, 32),
    path("f", "M31 36h8M39 36v38"),
    rect("p", 44, 30, 8, 26),                  // Brustpolster
    path("f", "M40 74h16"),
    head(50, 22),
    path("b", "M52 28L62 46"),                 // Rumpf vorgebeugt
    path("b", "M62 46L74 58L72 78"),           // Standbein
    path("b", "M62 46L84 44L92 56"),           // Arbeitsbein nach hinten
    path("f", "M86 40h10"),
    move("M74 34Q88 30 96 40"),
    tip(97, 42, 55)
  ].join(""));

  ART["abductor-adductor"] = svg([
    floor(8, 112),
    frontBody(60),
    rect("p", 34, 58, 10, 20, 3),
    rect("p", 76, 58, 10, 20, 3),
    path("b", "M56 58L44 74"),
    path("b", "M64 58L76 74"),
    path("f", "M40 84h40"),
    move("M32 50h-12"),
    tip(18, 50, 180),
    move("M88 50h12"),
    tip(102, 50, 0)
  ].join(""));

  ART["calf"] = svg([
    floor(8, 112),
    stack(92, 30),
    path("f", "M92 34h-8M84 34v40"),
    rect("p", 42, 28, 28, 7),                  // Schulterpolster
    rect("p", 30, 68, 34, 8, 2),               // Trittstufe
    path("f", "M36 76v8M58 76v8"),
    head(56, 20),
    path("b", "M56 26v24"),
    path("b", "M56 50L52 64L44 66"),           // Bein bis auf den Fußballen
    path("b", "M56 34L62 46"),                 // Arm am Polster
    move("M22 68V50"),
    tip(22, 48, -90)
  ].join(""));

  /* ------------------------------------------------------------------ Rumpf */

  ART["abdominal-crunch"] = svg([
    floor(8, 112),
    stack(96, 32),
    path("f", "M96 36h-8M88 36v38"),
    rect("p", 48, 60, 30, 7),
    rect("p", 76, 30, 7, 32),
    path("f", "M52 34h22M52 34v10"),           // Schulterpolster
    path("f", "M62 84h22"),
    head(64, 24),
    path("b", "M66 30L72 58"),
    path("b", "M72 58L56 63L54 78"),
    path("b", "M65 33L56 40"),
    move("M44 26Q34 40 44 52"),
    tip(46, 54, 60)
  ].join(""));

  ART["rotary-torso"] = svg([
    floor(8, 112),
    rect("p", 46, 58, 28, 8),
    path("f", "M60 66v18M48 84h24"),
    head(60, 22),
    path("b", "M60 28v28"),
    path("b", "M60 34L44 40"),                 // Rumpf gedreht
    path("b", "M60 34L78 30"),
    `<ellipse class="m" cx="60" cy="40" rx="30" ry="9"/>`,
    tip(88, 42, 70)
  ].join(""));

  window.TG_ART = ART;
})();
