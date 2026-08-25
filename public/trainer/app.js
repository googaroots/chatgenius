/**
 * Top Set — Trainings-App für Technogym-Geräte
 * Alles läuft lokal im Browser, die Daten liegen in localStorage.
 */
(function () {
  "use strict";

  const { WARMUP, REST, MUSCLES, EXERCISES, PROGRAM, WEEK_ORDER, VOLUME_TARGET, EVIDENCE } = window.TG;
  const ART = window.TG_ART || {};
  const STORE_KEY = "topset-hit-v1";

  /* ---------------------------------------------------------------- Zustand */

  const defaultSettings = () => ({
    effort: "rir",     // "rir" = 1–2 Wdh. Reserve | "failure" = letzter Satz bis zum Versagen
    warmup: "first"    // "first" = vor der ersten Übung je Region | "each" | "off"
  });

  const emptyState = () => ({
    v: 5,
    theme: null,          // null = System, "dark" | "light"
    settings: defaultSettings(),
    weights: {},          // exId -> { kg, reps, date }
    notes: {},            // exId -> Geräteeinstellung, z. B. "Sitz 4 · Lehne 2"
    bodyweight: [],       // { date, kg }
    deload: null,         // Wochenschlüssel der laufenden Entlastungswoche
    lastDeload: null,     // Datum der zuletzt abgeschlossenen Entlastungswoche
    history: [],          // { id, date, dayId, title, entries: [{ exId, kg, reps, hardSets }] }
    active: null          // laufendes Training
  });

  let state = load();
  let view = "today";
  let sheetOpen = false;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return emptyState();
      return migrate(JSON.parse(raw));
    } catch (err) {
      return emptyState();
    }
  }

  /**
   * Ältere Datenstände mitnehmen. Bis v3 lief die App auf dem HIT-Plan mit
   * einem Top-Set je Übung; Gewichte und Verlauf bleiben erhalten, das
   * laufende Training aus dem alten Satz-Modell wird verworfen.
   */
  function migrate(data) {
    const next = Object.assign(emptyState(), data);
    const old = (data.v || 1) < 4;
    next.settings = Object.assign(defaultSettings(), {
      // Vor v4 stand "effort" für das HIT-Top-Set bis zum Versagen — der neue
      // Plan startet mit der empfohlenen Reserve, umstellbar bleibt es.
      effort: old ? "rir" : ((data.settings && data.settings.effort) || "rir"),
      warmup: (data.settings && data.settings.warmup) || "first"
    });
    next.history = (next.history || []).map((s) => ({
      id: s.id,
      date: s.date,
      dayId: s.dayId,
      title: s.title || (old ? "Früheres Programm" : ""),
      entries: (s.entries || []).map((e) => ({ ...e, hardSets: e.hardSets || 1 }))
    }));
    if (old) next.active = null;
    next.notes = next.notes || {};
    next.bodyweight = Array.isArray(next.bodyweight) ? next.bodyweight : [];
    next.v = 5;
    return next;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Privater Modus o. Ä. — die App läuft weiter, nur ohne Verlauf. */
    }
  }

  /* ------------------------------------------------------------ Rechenteil */

  function roundTo(value, step) {
    return Math.max(step, Math.round(value / step) * step);
  }

  function fmtKg(kg) {
    if (kg === null || kg === undefined || isNaN(kg)) return "—";
    return (Math.round(kg * 10) / 10).toString().replace(".", ",");
  }

  function fmtNum(n) {
    return (Math.round(n * 10) / 10).toString().replace(".", ",");
  }

  /** Montag der Woche als Schlüssel, z. B. "2026-08-24". */
  function weekKeyOf(date) {
    const d = new Date(date);
    const offset = (d.getDay() + 6) % 7;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  }
  function currentWeekKey() { return weekKeyOf(new Date()); }

  /** Trainingswochen seit der letzten Entlastungswoche. */
  function weeksSinceDeload() {
    const since = state.lastDeload ? new Date(state.lastDeload).getTime() : 0;
    const keys = new Set(
      state.history.filter((s) => new Date(s.date).getTime() > since).map((s) => weekKeyOf(s.date))
    );
    return keys.size;
  }

  const DELOAD_AFTER = 8;
  function deloadActive() { return state.deload === currentWeekKey(); }
  function deloadDue() { return !deloadActive() && weeksSinceDeload() >= DELOAD_AFTER; }

  /** Sätze der Übung — in der Entlastungswoche halbiert. */
  function setsOf(dayEx) {
    const dl = state.active ? state.active.deload : deloadActive();
    return dl ? Math.max(1, Math.round(dayEx.sets / 2)) : dayEx.sets;
  }

  function dayByWeekday(wd) { return PROGRAM.days.find((d) => d.weekday === wd) || null; }
  function dayById(id) { return PROGRAM.days.find((d) => d.id === id) || null; }

  function nextTrainingDay(fromWeekday) {
    for (let i = 1; i <= 7; i++) {
      const day = dayByWeekday((fromWeekday + i) % 7);
      if (day) return day;
    }
    return PROGRAM.days[0];
  }

  function repRange(dayEx) { return `${dayEx.min}–${dayEx.max}`; }

  function wantsWarmup(dayEx) {
    if (state.settings.warmup === "each") return true;
    if (state.settings.warmup === "first") return !!dayEx.ramp;
    return false;
  }

  function warmupCount(dayEx) { return wantsWarmup(dayEx) ? WARMUP.length : 0; }
  function rowCount(dayEx) { return warmupCount(dayEx) + setsOf(dayEx); }

  /** Hinweis für den Arbeitssatz — der letzte darf je nach Einstellung härter sein. */
  function workHint(index, total) {
    const last = index === total - 1;
    if (!last) return "1–2 Wdh. in Reserve lassen";
    return state.settings.effort === "failure"
      ? "Letzter Satz: bis zum Muskelversagen"
      : "Letzter Satz: 1 Wdh. in Reserve";
  }

  /** Alle Zeilen einer Übung: optionale Aufwärmsätze plus die Arbeitssätze. */
  function rowsFor(dayEx, kg) {
    const ex = EXERCISES[dayEx.id];
    const rows = [];
    if (wantsWarmup(dayEx)) {
      WARMUP.forEach((w) => rows.push({
        kind: "warm",
        label: w.label,
        hint: w.hint,
        reps: w.reps,
        rest: w.rest,
        kg: kg ? roundTo(kg * w.pct, ex.step) : null
      }));
    }
    const total = setsOf(dayEx);
    for (let i = 0; i < total; i++) {
      rows.push({
        kind: "work",
        nr: i + 1,
        label: `Satz ${i + 1}`,
        hint: workHint(i, total),
        reps: repRange(dayEx),
        rest: ex.compound ? REST.compound : REST.isolation,
        kg: kg || null,
        last: i === total - 1
      });
    }
    return rows;
  }

  /** Harte Sätze einer Übung — Aufwärmsätze zählen nicht mit. */
  function hardSetsOf(dayEx, entry) {
    return entry.done.slice(warmupCount(dayEx)).filter(Boolean).length;
  }

  function plannedHardSets(day) {
    return day.exercises.reduce((n, e) => n + setsOf(e), 0);
  }

  function estimatedMinutes(day) {
    const sets = plannedHardSets(day);
    const warm = day.exercises.filter(wantsWarmup).length * WARMUP.length;
    return Math.round(sets * 2.2 + warm * 1.2);
  }

  /** Doppelte Progression: obere Grenze der Spanne erreicht → mehr Gewicht. */
  function progression(dayEx) {
    const last = state.weights[dayEx.id];
    if (!last || !last.kg) return null;
    const step = EXERCISES[dayEx.id].step;
    const dl = state.active ? state.active.deload : deloadActive();
    if (dl) {
      return { kg: roundTo(last.kg * 0.9, step), kind: "hold",
        text: `Entlastungswoche: ${fmtKg(roundTo(last.kg * 0.9, step))} kg statt ${fmtKg(last.kg)} kg, halbe Satzzahl.` };
    }
    const base = `Zuletzt ${fmtKg(last.kg)} kg × ${last.reps} Wdh. im letzten Satz`;
    if (last.reps >= dayEx.max) {
      return { kg: last.kg + step, kind: "up", text: `${base} → heute +${fmtKg(step)} kg.` };
    }
    if (last.reps >= dayEx.min) {
      return { kg: last.kg, kind: "hold", text: `${base} → Gewicht halten, bis ${dayEx.max} Wdh. stehen.` };
    }
    return { kg: roundTo(last.kg * 0.9, step), kind: "down", text: `${base} → heute etwas leichter starten.` };
  }

  function verdictFor(dayEx, entry) {
    if (!entry.reps) return { kind: "hold", text: `Trag ein, wie viele Wiederholungen im letzten Satz standen (Ziel ${repRange(dayEx)}).` };
    if (entry.reps >= dayEx.max) return { kind: "up", text: `${dayEx.max}+ Wdh. — nächstes Mal geht mehr Gewicht.` };
    if (entry.reps >= dayEx.min) return { kind: "hold", text: `Im Zielbereich ${repRange(dayEx)}. Gewicht bleibt, bis ${dayEx.max} stehen.` };
    return { kind: "down", text: `Unter ${dayEx.min} Wdh. — beim nächsten Mal etwas leichter für saubere Technik.` };
  }

  function lastSessionFor(dayId) {
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].dayId === dayId && !state.history[i].title.startsWith("Früheres")) return state.history[i];
    }
    return null;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  /* --------------------------------------------------- Volumen je Muskel */

  function weekStart(weeksAgo) {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // 0 = Montag
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - weeksAgo * 7);
  }

  function sessionsInWeek(weeksAgo) {
    const start = weekStart(weeksAgo).getTime();
    const end = start + 7 * 24 * 3600 * 1000;
    return state.history.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start && t < end;
    });
  }

  /** Harte Sätze je Muskel: direkt belastet zählt voll, indirekt zur Hälfte. */
  function volumeOf(sessions) {
    const vol = {};
    sessions.forEach((s) => {
      s.entries.forEach((e) => {
        const ex = EXERCISES[e.exId];
        if (!ex) return;
        const n = e.hardSets || 1;
        vol[ex.primary] = (vol[ex.primary] || 0) + n;
        (ex.secondary || []).forEach((m) => { vol[m] = (vol[m] || 0) + n * 0.5; });
      });
    });
    return vol;
  }

  function plannedVolume() {
    const vol = {};
    PROGRAM.days.forEach((day) => {
      day.exercises.forEach((dayEx) => {
        const ex = EXERCISES[dayEx.id];
        vol[ex.primary] = (vol[ex.primary] || 0) + dayEx.sets;
        (ex.secondary || []).forEach((m) => { vol[m] = (vol[m] || 0) + dayEx.sets * 0.5; });
      });
    });
    return vol;
  }

  /* --------------------------------------------------------------- Training */

  function startSession(dayId) {
    const day = dayById(dayId);
    if (!day) return;
    state.active = {
      dayId,
      deload: deloadActive(),
      startedAt: new Date().toISOString(),
      sets: Object.fromEntries(day.exercises.map((dayEx, i) => {
        const p = progression(dayEx);
        return [slot(dayEx, i), { kg: p ? p.kg : null, reps: null, done: new Array(rowCount(dayEx)).fill(false) }];
      }))
    };
    save();
    go("today");
  }

  /** Eine Übung kann zweimal am Tag vorkommen — der Index hält sie auseinander. */
  function slot(dayEx, i) { return `${i}:${dayEx.id}`; }

  function finishSession() {
    const act = state.active;
    if (!act) return;
    const day = dayById(act.dayId);
    const entries = day.exercises
      .map((dayEx, i) => ({ dayEx, entry: act.sets[slot(dayEx, i)] }))
      .filter((e) => e.entry && e.entry.kg && hardSetsOf(e.dayEx, e.entry) > 0)
      .map((e) => ({
        exId: e.dayEx.id,
        kg: e.entry.kg,
        reps: e.entry.reps || 0,
        hardSets: hardSetsOf(e.dayEx, e.entry)
      }));

    if (entries.length) {
      state.history.push({
        id: act.startedAt,
        date: new Date().toISOString(),
        dayId: act.dayId,
        title: day.title,
        entries
      });
      entries.forEach((e) => {
        if (e.reps) state.weights[e.exId] = { kg: e.kg, reps: e.reps, date: new Date().toISOString() };
      });
    }
    state.active = null;
    save();
    go("today");
  }

  /* ----------------------------------------------------------- Pausen-Timer */

  const timer = { id: null, left: 0, label: "" };

  function startRest(seconds, label) {
    stopRest();
    timer.left = seconds;
    timer.label = label;
    timer.id = setInterval(() => {
      timer.left--;
      if (timer.left <= 0) { stopRest(); signal(); return; }
      renderTimer();
    }, 1000);
    renderTimer();
  }

  function stopRest() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null;
    timer.left = 0;
    renderTimer();
  }

  function signal() {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) { /* Ton ist Beiwerk */ }
  }

  function renderTimer() {
    const box = document.getElementById("timer");
    if (!timer.id) {
      box.hidden = true;
      document.body.classList.remove("timer-on");
      return;
    }
    box.hidden = false;
    document.body.classList.add("timer-on"); // Platz schaffen, damit die Leiste nichts verdeckt
    box.classList.toggle("warn", timer.left <= 10);
    const m = Math.floor(timer.left / 60);
    const s = String(timer.left % 60).padStart(2, "0");
    box.querySelector(".timer-count").textContent = `${m}:${s}`;
    box.querySelector(".timer-label").textContent = timer.label;
  }

  /* ----------------------------------------------------------- Darstellung */

  /** Piktogramm einer Übung; fehlt eines, bleibt der Platz leer. */
  function art(exId) { return ART[exId] || ""; }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function weekStrip(todayWd) {
    return `<ul class="daychips">${WEEK_ORDER.map((wd) => {
      const day = dayByWeekday(wd);
      const rest = PROGRAM.restDays[wd];
      const cls = ["daychip", day ? "train" : "rest", wd === todayWd ? "today" : ""].join(" ");
      return `<li class="${cls}" title="${esc(day ? day.title : "Pause")}">${day ? day.short : (rest ? rest.short : "")}</li>`;
    }).join("")}</ul>`;
  }

  function renderToday() {
    if (state.active) return renderSession();

    const wd = new Date().getDay();
    const day = dayByWeekday(wd);
    const strip = weekStrip(wd);

    if (!day) {
      const rest = PROGRAM.restDays[wd] || { weekdayName: "Heute", logic: "Regeneration" };
      const next = nextTrainingDay(wd);
      return `
        <div class="today-head">
          <span class="eyebrow">${esc(rest.weekdayName)} · Pausentag</span>
          <h1>Heute wird nicht trainiert</h1>
          <p class="sub">${esc(rest.logic)}.</p>
        </div>
        ${strip}
        <div class="card stack">
          <span class="eyebrow">Als Nächstes</span>
          <h2 class="card-title">${esc(next.weekdayName)} · ${esc(next.title)}</h2>
          <p class="muted nomargin">${esc(next.subtitle)} — ${esc(next.focus)}.</p>
          <ul class="ex-list">${next.exercises.map((dayEx, i) => exRow(dayEx, i)).join("")}</ul>
          <button class="btn btn-ghost" data-act="start" data-day="${next.id}">Einheit trotzdem jetzt starten</button>
        </div>
        <div class="hintbox">Pausentage sind Teil des Plans: Der Muskel wächst zwischen den Einheiten, nicht während.</div>
        ${deloadBanner()}
      `;
    }

    const last = lastSessionFor(day.id);
    return `
      ${deloadBanner()}
      <div class="today-head">
        <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id} von ${PROGRAM.days.length}</span>
        <h1>${esc(day.title)}</h1>
        <p class="sub">${esc(day.subtitle)}</p>
      </div>
      ${strip}
      <div class="focus-line"><span>Fokus: ${esc(day.focus)}. ${esc(day.logic)}.</span></div>
      <div class="card stack">
        <div class="row-between">
          <span class="eyebrow">Heutige Übungen</span>
          <span class="muted data small">${day.exercises.length} Übungen · ~${estimatedMinutes(day)} Min</span>
        </div>
        <ul class="ex-list">${day.exercises.map((dayEx, i) => exRow(dayEx, i)).join("")}</ul>
        <button class="btn" data-act="start" data-day="${day.id}">Training starten</button>
        <p class="muted data small nomargin">${plannedHardSets(day)} Arbeitssätze${last ? ` · zuletzt am ${formatDate(last.date)}` : ""}</p>
      </div>
      <div class="hintbox"><b>Vorher:</b> 5–10 Min lockeres Cardio (Excite Run, Bike oder Synchro) plus Mobilisation der beteiligten Gelenke.</div>
    `;
  }

  /** Hinweis auf die fällige oder laufende Entlastungswoche. */
  function deloadBanner() {
    if (deloadActive()) {
      return `<div class="banner">
        <div>
          <b>Entlastungswoche läuft</b>
          <span>Halbe Satzzahl, 10 % weniger Gewicht — die Belastung sinkt, die Anpassung holt auf.</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-act="deload-end">Beenden</button>
      </div>`;
    }
    if (deloadDue()) {
      return `<div class="banner due">
        <div>
          <b>${weeksSinceDeload()} Trainingswochen am Stück</b>
          <span>Zeit für eine leichte Woche: halbe Sätze, 10 % weniger Gewicht. Danach geht es mit frischen Reserven weiter.</span>
        </div>
        <button class="btn btn-sm" data-act="deload-start">Leichte Woche</button>
      </div>`;
    }
    return "";
  }

  function exRow(dayEx, i) {
    const ex = EXERCISES[dayEx.id];
    const p = progression(dayEx);
    return `
      <li class="ex-row">
        <span class="thumb">${art(dayEx.id)}<i class="data">${String(i + 1).padStart(2, "0")}</i></span>
        <span>
          <span class="name">${esc(ex.name)}</span>
          <span class="meta">${setsOf(dayEx)} × ${repRange(dayEx)} Wdh. · ${esc(ex.target)}</span>
          ${state.notes[dayEx.id] ? `<span class="meta note">⚙ ${esc(state.notes[dayEx.id])}</span>` : ""}
        </span>
        <span class="load">${p ? fmtKg(p.kg) : "—"}<small>${p ? "KG" : "NEU"}</small></span>
      </li>`;
  }

  function renderSession() {
    const act = state.active;
    const day = dayById(act.dayId);
    const total = day.exercises.length;
    const done = day.exercises.filter((dayEx, i) => hardSetsOf(dayEx, act.sets[slot(dayEx, i)]) >= setsOf(dayEx)).length;
    const hard = day.exercises.reduce((n, dayEx, i) => n + hardSetsOf(dayEx, act.sets[slot(dayEx, i)]), 0);

    return `
      <div class="today-head">
        <span class="eyebrow">Training läuft · Tag ${day.id}</span>
        <h1>${esc(day.title)}</h1>
        <p class="sub"><span class="data">${done}/${total}</span> Übungen · <span class="data">${hard}/${plannedHardSets(day)}</span> Arbeitssätze</p>
      </div>
      ${day.exercises.map((dayEx, i) => sessionCard(dayEx, i)).join("")}
      <div class="sheet-actions mt-16">
        <button class="btn btn-ghost" data-act="cancel">Abbrechen</button>
        <button class="btn" data-act="finish">Training abschließen</button>
      </div>
    `;
  }

  function sessionCard(dayEx, i) {
    const ex = EXERCISES[dayEx.id];
    const key = slot(dayEx, i);
    const entry = state.active.sets[key];
    const p = progression(dayEx);
    const rows = rowsFor(dayEx, entry.kg);
    const hard = hardSetsOf(dayEx, entry);

    return `
      <article class="session-ex ${hard >= setsOf(dayEx) ? "" : "active"}" data-slot="${key}" data-ex="${dayEx.id}">
        <header>
          <span class="art-box">${art(dayEx.id)}<i class="idx data">${String(i + 1).padStart(2, "0")}</i></span>
          <div class="grow">
            <h3>${esc(ex.name)}</h3>
            <div class="machine">${esc(ex.machine)} — ${esc(ex.target)}</div>
          </div>
          <span class="pill ${hard >= setsOf(dayEx) ? "pill-done" : ""}"><span class="data">${hard}/${setsOf(dayEx)}</span></span>
        </header>
        <div class="session-body">
          <div class="topset-input">
            <div class="field">
              <label for="kg-${key}">Arbeitsgewicht kg</label>
              <input id="kg-${key}" type="number" inputmode="decimal" step="${ex.step}" min="0"
                     data-role="kg" value="${entry.kg !== null ? entry.kg : ""}" placeholder="0">
            </div>
            <button class="btn btn-ghost btn-sm" data-act="kg-" aria-label="Gewicht verringern">− ${fmtKg(ex.step)}</button>
            <button class="btn btn-ghost btn-sm" data-act="kg+" aria-label="Gewicht erhöhen">+ ${fmtKg(ex.step)}</button>
          </div>
          ${p ? `<div class="verdict ${p.kind}">${esc(p.text)}</div>`
              : `<div class="hintbox">Noch kein Wert hinterlegt: Starte mit einem Gewicht, das du sauber ${repRange(dayEx)} Mal bewegst.</div>`}
          <div class="ramp">
            ${rows.map((s, idx) => `
              <div class="set ${s.kind === "warm" ? "warm" : "work"} ${s.last ? "last" : ""} ${entry.done[idx] ? "done" : ""}" data-set="${idx + 1}">
                <span class="bar"></span>
                <span class="set-label">
                  <b>${esc(s.label)}</b>
                  <span><span class="reps">${esc(s.reps)} Wdh.</span> · ${esc(s.hint)}</span>
                </span>
                <span class="kg">${s.kg !== null ? fmtKg(s.kg) : "—"} <em>kg</em></span>
                <button class="set-check" data-act="toggle" data-idx="${idx}"
                        aria-label="${esc(s.label)} abhaken" aria-pressed="${entry.done[idx]}">${entry.done[idx] ? "✓" : ""}</button>
              </div>`).join("")}
          </div>
          ${hard > 0 ? `
            <div class="result-row">
              <div class="field narrow">
                <label for="reps-${key}">Wdh. im letzten Satz</label>
                <input id="reps-${key}" type="number" inputmode="numeric" step="1" min="0" max="40"
                       data-role="reps" value="${entry.reps !== null ? entry.reps : ""}" placeholder="—">
              </div>
              <div class="verdict ${verdictFor(dayEx, entry).kind} grow-min">${esc(verdictFor(dayEx, entry).text)}</div>
            </div>` : ""}
          <div class="field wide">
            <label for="note-${key}">Geräteeinstellung merken</label>
            <input id="note-${key}" type="text" data-role="note" maxlength="60"
                   value="${esc(state.notes[dayEx.id] || "")}" placeholder="z. B. Sitz 4 · Lehne 2 · Griff eng">
          </div>
          <div class="hintbox">
            <span><b>Einstellung:</b> ${esc(ex.tip)}</span>
            ${ex.alt ? `<span class="alt-line"><b>Gerät besetzt?</b> ${esc(ex.alt)}</span>` : ""}
          </div>
        </div>
      </article>`;
  }

  /* ------------------------------------------------------------------ Plan */

  function renderPlan() {
    return `
      <div class="today-head">
        <span class="eyebrow">${esc(PROGRAM.name)}</span>
        <h1>Der Plan</h1>
        <p class="sub">${esc(PROGRAM.tagline)}</p>
      </div>

      <div class="card stack">
        <div class="row-between">
          <span class="eyebrow">So läuft eine Übung</span>
          <button class="btn btn-ghost btn-sm" data-act="sheet">Ändern</button>
        </div>
        <p class="muted nomargin">${esc(PROGRAM.note)}</p>
        <div class="ramp">
          ${WARMUP.map((w) => `
            <div class="set warm">
              <span class="bar"></span>
              <span class="set-label"><b>${esc(w.label)}</b><span><span class="reps">${esc(w.reps)} Wdh.</span> · ${esc(w.hint)}</span></span>
              <span class="kg">${Math.round(w.pct * 100)} <em>%</em></span>
            </div>`).join("")}
          <div class="set work">
            <span class="bar"></span>
            <span class="set-label"><b>Arbeitssätze</b><span><span class="reps">2–3 Sätze</span> · ${esc(workHint(0, 3))}</span></span>
            <span class="kg">100 <em>%</em></span>
          </div>
          <div class="set work last">
            <span class="bar"></span>
            <span class="set-label"><b>Letzter Satz</b><span><span class="reps">bis ans Limit</span> · ${esc(workHint(2, 3).replace("Letzter Satz: ", ""))}</span></span>
            <span class="kg">100 <em>%</em></span>
          </div>
        </div>
        <p class="muted small nomargin">
          Aufwärmsätze ${state.settings.warmup === "each" ? "vor jeder Übung" : state.settings.warmup === "first" ? "vor der ersten Übung je Körperregion" : "ausgeschaltet"} ·
          Pause ${REST.compound / 60} Min nach schweren, ${REST.isolation} s nach isolierten Sätzen.
        </p>
      </div>

      <div class="card stack">
        <span class="eyebrow">Wochenrhythmus</span>
        <div class="week">
          ${WEEK_ORDER.map((wd) => {
            const day = dayByWeekday(wd);
            if (!day) {
              const r = PROGRAM.restDays[wd];
              if (!r) return "";
              return `<div class="week-row pause"><span class="wd">${r.short}</span>
                        <span><b>Pause</b><br><span class="why">${esc(r.logic)}</span></span></div>`;
            }
            return `<div class="week-row"><span class="wd">${day.short}</span>
                      <span><b>Tag ${day.id}: ${esc(day.title)}</b><br><span class="why">${esc(day.logic)}</span></span></div>`;
          }).join("")}
        </div>
      </div>

      ${PROGRAM.days.map((day) => `
        <div class="card stack">
          <div class="row-between">
            <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id}</span>
            <span class="muted small">${plannedHardSets(day)} Sätze</span>
          </div>
          <h2 class="card-title">${esc(day.title)}</h2>
          <p class="muted small nomargin">${esc(day.focus)}</p>
          <div>
            ${day.exercises.map((dayEx) => {
              const ex = EXERCISES[dayEx.id];
              return `<details class="acc">
                <summary><b>${esc(ex.name)}</b><span class="machine data">${setsOf(dayEx)} × ${repRange(dayEx)}</span></summary>
                <div class="acc-body">
                  <span class="art-box wide">${art(dayEx.id)}</span>
                  <span><b>Ziel-Muskel:</b> ${esc(ex.target)}</span>
                  <span><b>Gerät:</b> ${esc(ex.machine)}</span>
                  <span><b>Einstellung:</b> ${esc(ex.tip)}</span>
                  <span><b>Warum drin:</b> ${esc(ex.why)}</span>
                  ${ex.alt ? `<span><b>Ersatz:</b> ${esc(ex.alt)}</span>` : ""}
                  ${state.notes[dayEx.id] ? `<span><b>Deine Einstellung:</b> ${esc(state.notes[dayEx.id])}</span>` : ""}
                </div>
              </details>`;
            }).join("")}
          </div>
          <button class="btn btn-ghost" data-act="start" data-day="${day.id}">Diese Einheit starten</button>
        </div>`).join("")}

      <div class="card stack">
        <span class="eyebrow">Warum der Plan so aussieht</span>
        <h2 class="card-title">Studienlage in fünf Punkten</h2>
        ${EVIDENCE.map((e) => `
          <div class="ev">
            <b>${esc(e.claim)}</b>
            <span>${esc(e.detail)}</span>
            <span class="src">${esc(e.source)}</span>
          </div>`).join("")}
      </div>
    `;
  }

  /* ------------------------------------------------------------ Fortschritt */

  /** Kleine Verlaufskurve; letzter Punkt betont. */
  function sparkline(values, label, w, h) {
    if (!values || values.length < 2) return `<span class="spark-empty data">—</span>`;
    w = w || 96; h = h || 30;
    const pad = 4;
    const min = Math.min(...values), max = Math.max(...values);
    const span = (max - min) || 1;
    const pts = values.map((v, i) => [
      pad + (i * (w - 2 * pad)) / (values.length - 1),
      h - pad - ((v - min) / span) * (h - 2 * pad)
    ]);
    const d = pts.map((pt, i) => `${i ? "L" : "M"}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join("");
    const area = `${d}L${pts[pts.length - 1][0].toFixed(1)} ${h - pad}L${pts[0][0].toFixed(1)} ${h - pad}Z`;
    const end = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
      <path class="sp-area" d="${area}"/>
      <path class="sp-line" d="${d}" vector-effect="non-scaling-stroke"/>
      <circle class="sp-dot" cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="4"/>
    </svg>`;
  }

  /* ------------------------------------------------------- Körpergewicht */

  function addBodyweight(kg) {
    if (!kg || isNaN(kg)) return;
    const today = new Date().toISOString().slice(0, 10);
    state.bodyweight = state.bodyweight.filter((b) => b.date.slice(0, 10) !== today);
    state.bodyweight.push({ date: new Date().toISOString(), kg });
    state.bodyweight.sort((a, b) => new Date(a.date) - new Date(b.date));
    save();
    render();
  }

  /** Veränderung gegenüber dem Eintrag, der vier Wochen zurückliegt. */
  function bodyweightTrend() {
    const bw = state.bodyweight;
    if (bw.length < 2) return null;
    const latest = bw[bw.length - 1];
    const target = new Date(latest.date).getTime() - 28 * 24 * 3600 * 1000;
    let ref = bw[0];
    bw.forEach((b) => {
      if (Math.abs(new Date(b.date).getTime() - target) < Math.abs(new Date(ref.date).getTime() - target)) ref = b;
    });
    if (ref === latest) return null;
    const diff = latest.kg - ref.kg;
    const days = Math.round((new Date(latest.date) - new Date(ref.date)) / (24 * 3600 * 1000));
    return { diff, days };
  }

  function renderProgress() {
    const sessions = state.history.length;
    const volume = state.history.reduce((sum, s) => sum + s.entries.reduce((v, e) => v + e.kg * (e.reps || 0), 0), 0);
    const thisWeek = sessionsInWeek(0);
    const weekVol = volumeOf(thisWeek);
    const planned = plannedVolume();
    const hardThisWeek = thisWeek.reduce((n, s) => n + s.entries.reduce((m, e) => m + (e.hardSets || 1), 0), 0);

    const perExercise = Object.keys(EXERCISES).map((exId) => {
      const hist = state.history
        .flatMap((s) => s.entries.filter((e) => e.exId === exId).map((e) => ({ ...e, date: s.date })))
        .slice(-5);
      return { exId, hist, best: hist.length ? Math.max(...hist.map((h) => h.kg)) : null };
    }).filter((row) => row.hist.length && state.weights[row.exId]);

    const muscleIds = Object.keys(MUSCLES).filter((m) => (weekVol[m] || planned[m]));

    return `
      <div class="today-head">
        <span class="eyebrow">Verlauf</span>
        <h1>Fortschritt</h1>
        <p class="sub">Zwei Zahlen entscheiden: das Gewicht je Übung und die harten Sätze pro Muskel.</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="v">${sessions}</div><div class="k">Einheiten</div></div>
        <div class="stat"><div class="v">${hardThisWeek}</div><div class="k">Sätze /Woche</div></div>
        <div class="stat"><div class="v">${fmtVolume(volume)}</div><div class="k">Volumen</div></div>
      </div>

      <div class="card stack">
        <div class="row-between">
          <span class="eyebrow">Harte Sätze je Muskel</span>
          <span class="muted data small">diese Woche · Ziel ${VOLUME_TARGET.min}–${VOLUME_TARGET.max}</span>
        </div>
        <div class="vol">
          ${muscleIds.map((m) => {
            const done = weekVol[m] || 0;
            const plan = planned[m] || 0;
            const pct = (v) => Math.min(100, (v / VOLUME_TARGET.scaleMax) * 100);
            return `<div class="vol-row">
              <span class="vol-lbl"><b>${esc(MUSCLES[m])}</b><span class="data">${fmtNum(done)}${plan ? ` / ${fmtNum(plan)} geplant` : ""}</span></span>
              <span class="vol-track">
                <span class="vol-plan" style="width:${pct(plan)}%"></span>
                <span class="vol-fill" style="width:${pct(done)}%"></span>
              </span>
            </div>`;
          }).join("")}
        </div>
        <div class="vol-scale"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
        <div class="vol-legend">
          <span><i class="sw fill"></i> diese Woche erledigt</span>
          <span><i class="sw plan"></i> im Plan vorgesehen</span>
          <span><i class="sw band"></i> Zielkorridor</span>
        </div>
        <p class="muted small nomargin">Direkt belastete Muskeln zählen voll, indirekt beteiligte zur Hälfte — so rechnen auch die Volumen-Meta-Analysen. Aufwärmsätze zählen nicht mit.</p>
      </div>

      ${bodyweightCard()}

      ${perExercise.length ? `
        <div class="card">
          <span class="eyebrow">Gewichte je Übung</span>
          <div class="mt-8">
            ${perExercise.map((row) => {
              const ex = EXERCISES[row.exId];
              const cur = state.weights[row.exId];
              return `<div class="prog-row">
                <span>
                  <span class="nm">${esc(ex.name)}</span><br>
                  <span class="hist">${row.hist.map((h) => `${fmtKg(h.kg)}×${h.reps}`).join("  ›  ")}</span>
                </span>
                <span class="sparkwrap">${sparkline(row.hist.map((h) => h.kg), `Verlauf ${ex.name}`)}</span>
                <span class="cur">${fmtKg(cur.kg)} kg<small>Best ${fmtKg(row.best)} kg</small></span>
              </div>`;
            }).join("")}
          </div>
        </div>` : `<div class="card muted">Noch keine abgeschlossene Einheit. Nach dem ersten Training stehen hier deine Gewichte, das Wochenvolumen und die Vorschläge fürs nächste Mal.</div>`}

      ${sessions ? `
        <div class="card">
          <span class="eyebrow">Letzte Einheiten</span>
          <div class="mt-8">
            ${state.history.slice(-10).reverse().map((s) => {
              const hard = s.entries.reduce((n, e) => n + (e.hardSets || 1), 0);
              const day = dayById(s.dayId);
              const title = s.title || (day ? day.title : "Training");
              return `<div class="log-entry">
                <div class="head"><b>${esc(title)}</b><span class="date">${formatDate(s.date)} · ${hard} Sätze</span></div>
                <div class="sets">${s.entries.map((e) => `${esc(EXERCISES[e.exId] ? EXERCISES[e.exId].name : e.exId)}: ${fmtKg(e.kg)} kg × ${e.reps}`).join(" · ")}</div>
              </div>`;
            }).join("")}
          </div>
        </div>` : ""}

      <div class="card stack">
        <span class="eyebrow">Daten</span>
        <p class="muted small nomargin">Alles liegt nur in diesem Browser. Exportiere deinen Verlauf, bevor du das Gerät wechselst.</p>
        <div class="sheet-actions">
          <button class="btn btn-ghost btn-sm" data-act="export">Exportieren</button>
          <button class="btn btn-ghost btn-sm" data-act="import">Importieren</button>
          <button class="btn btn-ghost btn-sm" data-act="reset">Zurücksetzen</button>
        </div>
      </div>
    `;
  }

  function bodyweightCard() {
    const bw = state.bodyweight;
    const latest = bw.length ? bw[bw.length - 1] : null;
    const trend = bodyweightTrend();
    const series = bw.slice(-16).map((b) => b.kg);
    return `
      <div class="card stack">
        <div class="row-between">
          <span class="eyebrow">Körpergewicht</span>
          ${trend ? `<span class="muted data small">${trend.diff >= 0 ? "+" : "−"}${fmtKg(Math.abs(trend.diff))} kg in ${trend.days} Tagen</span>` : ""}
        </div>
        ${latest ? `
          <div class="bw-row">
            <span class="bw-val data">${fmtKg(latest.kg)}<em> kg</em></span>
            <span class="bw-chart">${sparkline(series, "Verlauf Körpergewicht", 200, 54)}</span>
          </div>
          <p class="muted small nomargin">Zuletzt am ${formatDate(latest.date)} · ${bw.length} ${bw.length === 1 ? "Eintrag" : "Einträge"}</p>
        ` : `<p class="muted small nomargin">Einmal pro Woche wiegen, am besten morgens nüchtern — erst der Verlauf über Wochen zeigt, ob Kalorien und Volumen zusammenpassen.</p>`}
        <div class="topset-input">
          <div class="field">
            <label for="bw-input">Heute wiegen</label>
            <input id="bw-input" type="number" inputmode="decimal" step="0.1" min="20" max="300"
                   placeholder="${latest ? fmtKg(latest.kg) : "0"}">
          </div>
          <button class="btn btn-ghost btn-sm" data-act="bw-save">Eintragen</button>
        </div>
      </div>`;
  }

  /** Bewegte Last: unter 10 t in kg, darüber in Tonnen. */
  function fmtVolume(kg) {
    if (kg < 10000) return `${Math.round(kg)}<span class="unit"> kg</span>`;
    return `${(kg / 1000).toFixed(1).replace(".", ",")}<span class="unit"> t</span>`;
  }

  /* ------------------------------------------------------- Einstellungen */

  function renderSheet() {
    const s = state.settings;
    const opt = (group, value, title, desc, recommended) => `
      <button class="opt ${s[group] === value ? "on" : ""}" data-act="set" data-group="${group}" data-value="${value}">
        <span class="opt-mark" aria-hidden="true">${s[group] === value ? "✓" : ""}</span>
        <span class="opt-text">
          <b>${esc(title)}${recommended ? ` <i class="rec">empfohlen</i>` : ""}</b>
          <span>${esc(desc)}</span>
        </span>
      </button>`;

    return `
      <div class="sheet-backdrop" data-act="sheet-close"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Einstellungen">
        <div class="sheet-head">
          <h2>Einstellungen</h2>
          <button class="icon-btn" data-act="sheet-close" aria-label="Schließen">✕</button>
        </div>
        <div class="sheet-body">
          <section>
            <span class="eyebrow">Letzter Satz einer Übung</span>
            ${opt("effort", "rir", "1 Wdh. in Reserve", "Praktisch gleicher Aufbau, bessere Kraftwerte, kürzere Erholung.", true)}
            ${opt("effort", "failure", "Bis zum Muskelversagen", "Maximaler Reiz je Satz — kostet 24–48 h mehr Erholung.")}
          </section>
          <section>
            <span class="eyebrow">Aufwärmsätze</span>
            ${opt("warmup", "first", "Vor der ersten Übung je Region", "Zwei kurze Sätze (50 % / 75 %). Danach ist der Muskel warm.", true)}
            ${opt("warmup", "each", "Vor jeder Übung", "Gründlicher, kostet aber rund 10 Minuten mehr.")}
            ${opt("warmup", "off", "Aus", "Nur sinnvoll, wenn du dich vorher ausführlich aufwärmst.")}
          </section>
          <section>
            <span class="eyebrow">Design</span>
            <div class="seg">
              <button class="seg-btn ${state.theme === null ? "on" : ""}" data-act="theme" data-value="system">System</button>
              <button class="seg-btn ${state.theme === "light" ? "on" : ""}" data-act="theme" data-value="light">Hell</button>
              <button class="seg-btn ${state.theme === "dark" ? "on" : ""}" data-act="theme" data-value="dark">Dunkel</button>
            </div>
          </section>
          <p class="muted small">Die Empfehlungen folgen den Meta-Analysen zu Volumen und Ausbelastung; die Belege stehen im Plan-Tab.</p>
        </div>
      </div>`;
  }

  function applySetting(group, value) {
    state.settings[group] = value;
    // Laufende Einheit an die neue Zeilenzahl anpassen: Arbeitssätze stehen
    // hinten, Aufwärmsätze werden vorn ergänzt oder entfernt.
    if (group === "warmup" && state.active) {
      const day = dayById(state.active.dayId);
      day.exercises.forEach((dayEx, i) => {
        const entry = state.active.sets[slot(dayEx, i)];
        if (!entry) return;
        const need = rowCount(dayEx);
        const work = entry.done.slice(entry.done.length - setsOf(dayEx));
        const warm = new Array(Math.max(0, need - setsOf(dayEx))).fill(false);
        entry.done = warm.concat(work);
      });
    }
    save();
    render();
  }

  /* ------------------------------------------------------------- Steuerung */

  function render() {
    const main = document.getElementById("main");
    main.innerHTML = view === "today" ? renderToday() : view === "plan" ? renderPlan() : renderProgress();
    document.getElementById("sheet").innerHTML = sheetOpen ? renderSheet() : "";
    document.body.classList.toggle("locked", sheetOpen);
    document.getElementById("brand-sub").textContent = PROGRAM.name;
    document.querySelectorAll(".tab").forEach((t) => {
      t.setAttribute("aria-selected", String(t.dataset.view === view));
    });
  }

  function go(next) {
    view = next;
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
    else document.documentElement.removeAttribute("data-theme");
  }

  function activeDayEx(card) {
    const day = dayById(state.active.dayId);
    const i = Number(card.dataset.slot.split(":")[0]);
    return { dayEx: day.exercises[i], entry: state.active.sets[card.dataset.slot] };
  }

  document.addEventListener("click", (ev) => {
    const tab = ev.target.closest(".tab");
    if (tab) { go(tab.dataset.view); return; }

    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;

    if (act === "sheet") { sheetOpen = true; render(); return; }
    if (act === "sheet-close") { sheetOpen = false; render(); return; }
    if (act === "set") { applySetting(btn.dataset.group, btn.dataset.value); return; }
    if (act === "theme") {
      state.theme = btn.dataset.value === "system" ? null : btn.dataset.value;
      applyTheme(); save(); render();
      return;
    }

    if (act === "start") { sheetOpen = false; startSession(Number(btn.dataset.day)); return; }
    if (act === "finish") { finishSession(); stopRest(); return; }
    if (act === "cancel") {
      if (confirm("Training verwerfen? Die eingetragenen Sätze gehen verloren.")) {
        state.active = null; save(); stopRest(); go("today");
      }
      return;
    }
    if (act === "deload-start") { state.deload = currentWeekKey(); save(); render(); return; }
    if (act === "deload-end") {
      state.deload = null;
      state.lastDeload = new Date().toISOString();
      save(); render();
      return;
    }
    if (act === "timer-stop") { stopRest(); return; }
    if (act === "timer-plus") { timer.left += 30; renderTimer(); return; }

    if (act === "bw-save") {
      const input = document.getElementById("bw-input");
      const val = parseFloat(String(input.value).replace(",", "."));
      if (isNaN(val)) { alert("Trag zuerst dein Gewicht ein."); return; }
      addBodyweight(Math.round(val * 10) / 10);
      return;
    }
    if (act === "export") { exportData(); return; }
    if (act === "import") { importData(); return; }
    if (act === "reset") {
      if (confirm("Wirklich alle Trainingsdaten löschen?")) { state = emptyState(); save(); applyTheme(); render(); }
      return;
    }

    const card = btn.closest(".session-ex");
    if (!card || !state.active) return;
    const { dayEx, entry } = activeDayEx(card);
    const step = EXERCISES[dayEx.id].step;

    if (act === "kg+" || act === "kg-") {
      const base = entry.kg || 0;
      entry.kg = Math.max(0, roundTo(base + (act === "kg+" ? step : -step), step));
      save(); render(); focusCard(card.dataset.slot);
      return;
    }
    if (act === "toggle") {
      const idx = Number(btn.dataset.idx);
      if (!entry.kg && !entry.done[idx]) { alert("Trag zuerst das Arbeitsgewicht ein — die Aufwärmsätze rechnet die App daraus."); return; }
      entry.done[idx] = !entry.done[idx];
      save(); render(); focusCard(card.dataset.slot);
      if (entry.done[idx]) {
        const rows = rowsFor(dayEx, entry.kg);
        const cur = rows[idx];
        const next = rows[idx + 1];
        startRest(cur.rest, next ? `Vor ${next.label}` : "Übungswechsel");
      }
    }
  });

  document.addEventListener("input", (ev) => {
    const input = ev.target.closest("[data-role]");
    if (!input || !state.active) return;
    const card = input.closest(".session-ex");
    if (!card) return;
    const { dayEx, entry } = activeDayEx(card);

    if (input.dataset.role === "kg") {
      const val = parseFloat(input.value.replace(",", "."));
      entry.kg = isNaN(val) ? null : val;
      // Satzgewichte live nachziehen, ohne die Karte neu zu bauen (Fokus bleibt im Feld)
      const rows = rowsFor(dayEx, entry.kg);
      card.querySelectorAll(".ramp .set").forEach((row, idx) => {
        if (!rows[idx]) return;
        row.querySelector(".kg").innerHTML = `${rows[idx].kg !== null ? fmtKg(rows[idx].kg) : "—"} <em>kg</em>`;
      });
    } else if (input.dataset.role === "note") {
      const exId = card.dataset.ex;
      const val = input.value.trim();
      if (val) state.notes[exId] = val; else delete state.notes[exId];
    } else if (input.dataset.role === "reps") {
      const val = parseInt(input.value, 10);
      entry.reps = isNaN(val) ? null : val;
      const v = verdictFor(dayEx, entry);
      const box = card.querySelector(".result-row .verdict");
      if (box) { box.className = `verdict ${v.kind} grow-min`; box.textContent = v.text; }
    }
    save();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && sheetOpen) { sheetOpen = false; render(); }
  });

  function focusCard(key) {
    const card = document.querySelector(`.session-ex[data-slot="${key}"]`);
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ------------------------------------------------------ Import / Export */

  async function exportData() {
    const json = JSON.stringify(state, null, 2);
    const filename = `topset-${new Date().toISOString().slice(0, 10)}.json`;

    // Läuft die App in einer Claude-Artifact-Ansicht, muss der Download über
    // deren Bestätigungsdialog gehen — ein normaler Link bleibt dort wirkungslos.
    if (window.claude && typeof window.claude.use === "function") {
      try {
        const downloads = await window.claude.use("downloads");
        if (downloads) {
          await downloads.save({ filename, data: json });
          return;
        }
      } catch (err) {
        if (err && err.code === "declined") return;
        // sonst: normaler Browser-Download als Rückfall
      }
    }

    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (!data || typeof data !== "object" || !Array.isArray(data.history)) throw new Error("Format");
          state = migrate(data);
          save(); applyTheme(); render();
        } catch (err) {
          alert("Diese Datei enthält keinen gültigen Trainingsverlauf.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /* ----------------------------------------------------------------- Start */

  applyTheme();
  save(); // migrierten Stand einmal festschreiben
  render();
})();
