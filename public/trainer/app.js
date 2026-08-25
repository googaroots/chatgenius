/**
 * Top Set — HIT-Trainer für Technogym-Geräte
 * Alles läuft lokal im Browser, die Daten liegen in localStorage.
 */
(function () {
  "use strict";

  const { RAMP, EXTRA_SETS, MUSCLES, EXERCISES, PROGRAMS, WEEK_ORDER, VOLUME_TARGET, EVIDENCE } = window.TG;
  const STORE_KEY = "topset-hit-v1";

  /* ---------------------------------------------------------------- Zustand */

  const defaultSettings = () => ({
    program: "hit5",   // "hit5" | "hybrid4"
    extra: "backoff",  // "backoff" | "restpause" | "none"
    effort: "failure"  // "failure" | "rir"
  });

  const emptyState = () => ({
    v: 2,
    theme: null,          // null = System, "dark" | "light"
    settings: defaultSettings(),
    weights: {},          // exId -> { kg, reps, date }
    history: [],          // { id, date, dayId, program, entries: [{ exId, kg, reps, hardSets }] }
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

  /** Ältere Datenstände (v1: ein Top-Set, nur der 5er-Split) mitnehmen. */
  function migrate(data) {
    const next = Object.assign(emptyState(), data);
    next.settings = Object.assign(defaultSettings(), data.settings || {});
    if (!PROGRAMS[next.settings.program]) next.settings.program = "hit5";
    next.history = (next.history || []).map((s) => ({
      ...s,
      program: s.program || "hit5",
      entries: (s.entries || []).map((e) => ({ ...e, hardSets: e.hardSets || 1 }))
    }));
    if (next.active && !next.active.program) next.active.program = "hit5";
    next.v = 2;
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

  function program() { return PROGRAMS[state.settings.program]; }
  function extraDef() { return EXTRA_SETS[state.settings.extra] || null; }
  function setCount() { return 4 + (extraDef() ? 1 : 0); }

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

  /** Top-Set-Beschreibung je nach eingestellter Ausbelastung. */
  function topSetHint() {
    return state.settings.effort === "rir"
      ? "6–8 Wdh., 1–2 in Reserve lassen"
      : "Bis zum Muskelversagen";
  }

  /** Alle Sätze einer Übung: Aufwärmrampe, Top-Set und optionales Zusatzvolumen. */
  function setsFor(exId, topKg) {
    const step = EXERCISES[exId].step;
    const list = RAMP.map((s) => ({
      nr: s.nr,
      label: s.label,
      reps: s.reps,
      hint: s.top ? topSetHint() : s.hint,
      rest: s.rest,
      kind: s.top ? "top" : "warm",
      kg: topKg ? (s.pct === 1 ? topKg : roundTo(topKg * s.pct, step)) : null
    }));
    const extra = extraDef();
    if (extra) {
      list.push({
        nr: 5,
        label: extra.label,
        reps: extra.reps,
        hint: extra.hint,
        rest: extra.rest,
        kind: "extra",
        kg: topKg ? (extra.pct === 1 ? topKg : roundTo(topKg * extra.pct, step)) : null
      });
    }
    return list;
  }

  /** Harte Sätze einer Übung — Aufwärmsätze zählen nicht mit. */
  function hardSetsOf(entry) {
    const extra = extraDef();
    let n = entry.done[3] ? 1 : 0;
    if (extra && entry.done[4]) n += extra.hardSets;
    return n;
  }

  function plannedHardSets(day) {
    const extra = extraDef();
    return day.exercises.length * (1 + (extra ? extra.hardSets : 0));
  }

  function estimatedMinutes(day) {
    return Math.round(day.exercises.length * (extraDef() ? 11 : 9));
  }

  /** HIT-Progression: 8+ Wdh. → schwerer, 6–7 → halten, unter 6 → zurück. */
  function progression(exId) {
    const last = state.weights[exId];
    if (!last || !last.kg) return null;
    const step = EXERCISES[exId].step;
    if (last.reps >= 8) {
      return { kg: last.kg + step, kind: "up",
        text: `Letztes Top-Set: ${fmtKg(last.kg)} kg × ${last.reps} Wdh. → heute +${fmtKg(step)} kg.` };
    }
    if (last.reps >= 6) {
      return { kg: last.kg, kind: "hold",
        text: `Letztes Top-Set: ${fmtKg(last.kg)} kg × ${last.reps} Wdh. → Gewicht halten, bis 8 Wdh. stehen.` };
    }
    return { kg: roundTo(last.kg * 0.9, step), kind: "down",
      text: `Letztes Top-Set: ${fmtKg(last.kg)} kg × ${last.reps} Wdh. → heute etwas leichter starten.` };
  }

  function dayByWeekday(wd) { return program().days.find((d) => d.weekday === wd) || null; }
  function dayById(id, programId) {
    const p = programId ? PROGRAMS[programId] : program();
    return (p ? p.days : []).find((d) => d.id === id) || null;
  }

  function nextTrainingDay(fromWeekday) {
    for (let i = 1; i <= 7; i++) {
      const day = dayByWeekday((fromWeekday + i) % 7);
      if (day) return day;
    }
    return program().days[0];
  }

  function lastSessionFor(dayId) {
    for (let i = state.history.length - 1; i >= 0; i--) {
      const s = state.history[i];
      if (s.dayId === dayId && s.program === state.settings.program) return s;
    }
    return null;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  /* --------------------------------------------------- Volumen je Muskel */

  /** Montag 00:00 der Woche, die `weeksAgo` Wochen zurückliegt. */
  function weekStart(weeksAgo) {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // 0 = Montag
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - weeksAgo * 7);
    return d;
  }

  function sessionsInWeek(weeksAgo) {
    const start = weekStart(weeksAgo).getTime();
    const end = start + 7 * 24 * 3600 * 1000;
    return state.history.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start && t < end;
    });
  }

  /** Harte Sätze je Muskel: direkt zählt voll, indirekt zur Hälfte. */
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

  /** Vorschau: was das aktuelle Programm mit den aktuellen Einstellungen ergäbe. */
  function plannedVolume() {
    const extra = extraDef();
    const perExercise = 1 + (extra ? extra.hardSets : 0);
    const vol = {};
    program().days.forEach((day) => {
      day.exercises.forEach((exId) => {
        const ex = EXERCISES[exId];
        vol[ex.primary] = (vol[ex.primary] || 0) + perExercise;
        (ex.secondary || []).forEach((m) => { vol[m] = (vol[m] || 0) + perExercise * 0.5; });
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
      program: state.settings.program,
      extra: state.settings.extra,
      startedAt: new Date().toISOString(),
      sets: Object.fromEntries(day.exercises.map((exId) => {
        const p = progression(exId);
        return [exId, { kg: p ? p.kg : null, reps: null, done: new Array(setCount()).fill(false) }];
      }))
    };
    save();
    go("today");
  }

  function finishSession() {
    const act = state.active;
    if (!act) return;
    const day = dayById(act.dayId, act.program);
    const entries = day.exercises
      .map((exId) => ({ exId, entry: act.sets[exId] }))
      .filter((e) => e.entry.kg && e.entry.done[3])
      .map((e) => ({
        exId: e.exId,
        kg: e.entry.kg,
        reps: e.entry.reps || 0,
        hardSets: hardSetsOf(e.entry)
      }));

    if (entries.length) {
      state.history.push({
        id: act.startedAt,
        date: new Date().toISOString(),
        dayId: act.dayId,
        program: act.program,
        entries
      });
      entries.forEach((e) => {
        state.weights[e.exId] = { kg: e.kg, reps: e.reps, date: new Date().toISOString() };
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

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function weekStrip(todayWd) {
    const p = program();
    return `<ul class="daychips">${WEEK_ORDER.map((wd) => {
      const day = p.days.find((d) => d.weekday === wd);
      const rest = p.restDays[wd];
      const cls = ["daychip", day ? "train" : "rest", wd === todayWd ? "today" : ""].join(" ");
      return `<li class="${cls}" title="${esc(day ? day.title : "Pause")}">${day ? day.short : (rest ? rest.short : "")}</li>`;
    }).join("")}</ul>`;
  }

  function renderToday() {
    if (state.active) return renderSession();

    const now = new Date();
    const wd = now.getDay();
    const day = dayByWeekday(wd);
    const strip = weekStrip(wd);

    if (!day) {
      const rest = program().restDays[wd] || { weekdayName: "Heute", logic: "Regeneration" };
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
          <ul class="ex-list">${next.exercises.map((exId, i) => exRow(exId, i)).join("")}</ul>
          <button class="btn btn-ghost" data-act="start" data-day="${next.id}">Einheit trotzdem jetzt starten</button>
        </div>
        <div class="hintbox">Regeneration ist Teil des Plans: HIT lebt davon, dass das Top-Set am Trainingstag wirklich alles bekommt.</div>
      `;
    }

    const last = lastSessionFor(day.id);
    const extra = extraDef();
    return `
      <div class="today-head">
        <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id} von ${program().days.length}</span>
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
        <ul class="ex-list">${day.exercises.map((exId, i) => exRow(exId, i)).join("")}</ul>
        <button class="btn" data-act="start" data-day="${day.id}">Training starten</button>
        <p class="muted data small nomargin">
          ${plannedHardSets(day)} harte Sätze geplant${extra ? ` · Top-Set + ${esc(extra.short)}` : " · nur Top-Set"}${last ? ` · zuletzt am ${formatDate(last.date)}` : ""}
        </p>
      </div>
      <div class="hintbox"><b>Vorher:</b> 5–10 Min lockeres Cardio (Excite Run, Bike oder Synchro) plus Mobilisation der beteiligten Gelenke — die Aufwärmsätze ersetzen das allgemeine Warm-up nicht.</div>
    `;
  }

  function exRow(exId, i) {
    const ex = EXERCISES[exId];
    const p = progression(exId);
    return `
      <li class="ex-row">
        <span class="num">${String(i + 1).padStart(2, "0")}</span>
        <span>
          <span class="name">${esc(ex.name)}</span>
          <span class="meta">${esc(ex.target)}</span>
        </span>
        <span class="load">${p ? fmtKg(p.kg) : "—"}<small>${p ? "KG TOP-SET" : "NEU"}</small></span>
      </li>`;
  }

  function renderSession() {
    const act = state.active;
    const day = dayById(act.dayId, act.program);
    const total = day.exercises.length;
    const done = day.exercises.filter((exId) => act.sets[exId].done[3]).length;
    const hard = day.exercises.reduce((n, exId) => n + hardSetsOf(act.sets[exId]), 0);

    return `
      <div class="today-head">
        <span class="eyebrow">Training läuft · Tag ${day.id}</span>
        <h1>${esc(day.title)}</h1>
        <p class="sub"><span class="data">${done}/${total}</span> Übungen · <span class="data">${hard}</span> harte Sätze im Kasten</p>
      </div>
      ${day.exercises.map((exId, i) => sessionCard(exId, i)).join("")}
      <div class="sheet-actions mt-16">
        <button class="btn btn-ghost" data-act="cancel">Abbrechen</button>
        <button class="btn" data-act="finish">Training abschließen</button>
      </div>
    `;
  }

  function sessionCard(exId, i) {
    const ex = EXERCISES[exId];
    const entry = state.active.sets[exId];
    const p = progression(exId);
    const sets = setsFor(exId, entry.kg);
    const doneCount = entry.done.filter(Boolean).length;

    return `
      <article class="session-ex ${entry.done[3] ? "" : "active"}" data-ex="${exId}">
        <header>
          <div class="grow">
            <h3>${String(i + 1).padStart(2, "0")} · ${esc(ex.name)}</h3>
            <div class="machine">${esc(ex.machine)} — ${esc(ex.target)}</div>
          </div>
          <span class="pill ${doneCount === sets.length ? "pill-done" : ""}"><span class="data">${doneCount}/${sets.length}</span></span>
        </header>
        <div class="session-body">
          <div class="topset-input">
            <div class="field">
              <label for="kg-${exId}">Top-Set kg</label>
              <input id="kg-${exId}" type="number" inputmode="decimal" step="${ex.step}" min="0"
                     data-role="kg" value="${entry.kg !== null ? entry.kg : ""}" placeholder="0">
            </div>
            <button class="btn btn-ghost btn-sm" data-act="kg-" aria-label="Gewicht verringern">− ${fmtKg(ex.step)}</button>
            <button class="btn btn-ghost btn-sm" data-act="kg+" aria-label="Gewicht erhöhen">+ ${fmtKg(ex.step)}</button>
          </div>
          ${p ? `<div class="verdict ${p.kind}">${esc(p.text)}</div>`
              : `<div class="hintbox">Noch kein Wert hinterlegt: Starte mit einem Gewicht, das du sauber 6–8 Mal bewegst.</div>`}
          <div class="ramp">
            ${sets.map((s, idx) => `
              <div class="set ${s.kind === "top" ? "top" : ""} ${s.kind === "extra" ? "extra" : ""} ${entry.done[idx] ? "done" : ""}" data-set="${s.nr}">
                <span class="bar"></span>
                <span class="set-label">
                  <b>${s.nr}. ${esc(s.label)}</b>
                  <span><span class="reps">${esc(s.reps)} Wdh.</span> · ${esc(s.hint)}</span>
                </span>
                <span class="kg">${s.kg !== null ? fmtKg(s.kg) : "—"} <em>kg</em></span>
                <button class="set-check" data-act="toggle" data-idx="${idx}" data-rest="${s.rest}"
                        aria-label="Satz ${s.nr} abhaken" aria-pressed="${entry.done[idx]}">${entry.done[idx] ? "✓" : ""}</button>
              </div>`).join("")}
          </div>
          ${entry.done[3] ? `
            <div class="result-row">
              <div class="field narrow">
                <label for="reps-${exId}">Wdh. im Top-Set</label>
                <input id="reps-${exId}" type="number" inputmode="numeric" step="1" min="0" max="30"
                       data-role="reps" value="${entry.reps !== null ? entry.reps : ""}" placeholder="—">
              </div>
              <div class="verdict ${verdictFor(entry).kind} grow-min">${esc(verdictFor(entry).text)}</div>
            </div>` : ""}
          <div class="hintbox"><b>Einstellung:</b> ${esc(ex.tip)}</div>
        </div>
      </article>`;
  }

  function verdictFor(entry) {
    if (!entry.reps) return { kind: "hold", text: "Trag ein, wie viele Wiederholungen du im Top-Set geschafft hast." };
    if (entry.reps >= 8) return { kind: "up", text: "8+ Wdh. — nächstes Mal geht mehr Gewicht." };
    if (entry.reps >= 6) return { kind: "hold", text: "Im Zielkorridor 6–8. Gewicht bleibt, bis 8 stehen." };
    return { kind: "down", text: "Unter 6 Wdh. — beim nächsten Mal etwas leichter für saubere Technik." };
  }

  /* ------------------------------------------------------------------ Plan */

  function renderPlan() {
    const p = program();
    const extra = extraDef();
    const sets = setsFor("chest-press", null);

    return `
      <div class="today-head">
        <span class="eyebrow">${esc(p.name)}</span>
        <h1>Der Plan</h1>
        <p class="sub">${esc(p.tagline)}</p>
      </div>

      <div class="card stack">
        <div class="row-between">
          <span class="eyebrow">Satz-Struktur pro Übung</span>
          <button class="btn btn-ghost btn-sm" data-act="sheet">Ändern</button>
        </div>
        <div class="ramp">
          ${sets.map((s) => `
            <div class="set ${s.kind === "top" ? "top" : ""} ${s.kind === "extra" ? "extra" : ""}" data-set="${s.nr}">
              <span class="bar"></span>
              <span class="set-label"><b>${s.nr}. ${esc(s.label)}</b><span><span class="reps">${esc(s.reps)} Wdh.</span> · ${esc(s.hint)}</span></span>
              <span class="kg">${s.kind === "extra" ? Math.round(EXTRA_SETS[state.settings.extra].pct * 100) : Math.round(RAMP[Math.min(s.nr, 4) - 1].pct * 100)} <em>%</em></span>
            </div>`).join("")}
        </div>
        <p class="muted small nomargin">Pausen: 60 s · 90 s · 2,5 Min vor dem Top-Set${extra ? ` · ${extra.rest / 60} Min vor dem ${esc(extra.short)}` : ""} · 3 Min zum Übungswechsel.</p>
        ${extra ? `<div class="hintbox"><b>${esc(extra.label)}:</b> ${esc(extra.describe)} Das ist der Hebel aus der Studienlage — er verdoppelt bis verdreifacht dein hartes Wochenvolumen.</div>` : `<div class="hintbox">Aktuell läuft nur das Top-Set. Mehrere harte Sätze pro Übung bringen nachweislich mehr — schau in die Einstellungen.</div>`}
      </div>

      <div class="card stack">
        <span class="eyebrow">Wochenrhythmus</span>
        <div class="week">
          ${WEEK_ORDER.map((wd) => {
            const day = p.days.find((d) => d.weekday === wd);
            if (!day) {
              const r = p.restDays[wd];
              if (!r) return "";
              return `<div class="week-row pause"><span class="wd">${r.short}</span>
                        <span><b>Pause</b><br><span class="why">${esc(r.logic)}</span></span></div>`;
            }
            return `<div class="week-row"><span class="wd">${day.short}</span>
                      <span><b>Tag ${day.id}: ${esc(day.title)}</b><br><span class="why">${esc(day.logic)}</span></span></div>`;
          }).join("")}
        </div>
      </div>

      ${p.days.map((day) => `
        <div class="card stack">
          <div class="row-between">
            <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id}</span>
            <span class="muted small">${esc(day.subtitle)}</span>
          </div>
          <h2 class="card-title">${esc(day.title)}</h2>
          <p class="muted small nomargin">Fokus: ${esc(day.focus)}</p>
          <div>
            ${day.exercises.map((exId) => {
              const ex = EXERCISES[exId];
              return `<details class="acc">
                <summary><b>${esc(ex.name)}</b><span class="machine">${esc(ex.machine)}</span></summary>
                <div class="acc-body">
                  <span><b>Ziel-Muskel:</b> ${esc(ex.target)}</span>
                  <span><b>Ablauf:</b> 3 Aufwärmsätze + Top-Set 6–8 Wdh.${extra ? ` + ${esc(extra.label)}` : ""}</span>
                  <span><b>Einstellung:</b> ${esc(ex.tip)}</span>
                  <span><b>HIT-Vorteil:</b> ${esc(ex.hit)}</span>
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
    }).filter((row) => row.hist.length);

    const muscleIds = Object.keys(MUSCLES).filter((m) => (weekVol[m] || planned[m]));

    return `
      <div class="today-head">
        <span class="eyebrow">Verlauf</span>
        <h1>Fortschritt</h1>
        <p class="sub">Zwei Zahlen entscheiden: das Top-Set je Übung und die harten Sätze pro Muskel.</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="v">${sessions}</div><div class="k">Einheiten</div></div>
        <div class="stat"><div class="v">${hardThisWeek}</div><div class="k">Harte Sätze /Wo.</div></div>
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
          <span><i class="sw plan"></i> mit dem aktuellen Programm geplant</span>
          <span><i class="sw band"></i> Zielkorridor</span>
        </div>
        <p class="muted small nomargin">Direkt belastete Muskeln zählen voll, indirekt beteiligte zur Hälfte — so rechnen auch die Volumen-Meta-Analysen. Aufwärmsätze zählen nicht mit.</p>
      </div>

      ${perExercise.length ? `
        <div class="card">
          <span class="eyebrow">Top-Set je Übung</span>
          <div class="mt-8">
            ${perExercise.map((row) => {
              const ex = EXERCISES[row.exId];
              const cur = state.weights[row.exId];
              return `<div class="prog-row">
                <span>
                  <span class="nm">${esc(ex.name)}</span><br>
                  <span class="hist">${row.hist.map((h) => `${fmtKg(h.kg)}×${h.reps}`).join("  ›  ")}</span>
                </span>
                <span class="cur">${fmtKg(cur.kg)} kg<small>Best ${fmtKg(row.best)} kg</small></span>
              </div>`;
            }).join("")}
          </div>
        </div>` : `<div class="card muted">Noch keine abgeschlossene Einheit. Nach dem ersten Training stehen hier deine Top-Sets, das Wochenvolumen und die Vorschläge fürs nächste Mal.</div>`}

      ${sessions ? `
        <div class="card">
          <span class="eyebrow">Letzte Einheiten</span>
          <div class="mt-8">
            ${state.history.slice(-10).reverse().map((s) => {
              const day = dayById(s.dayId, s.program);
              const hard = s.entries.reduce((n, e) => n + (e.hardSets || 1), 0);
              return `<div class="log-entry">
                <div class="head"><b>${esc(day ? day.title : "Training")}</b><span class="date">${formatDate(s.date)} · ${hard} harte Sätze</span></div>
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
            <span class="eyebrow">Programm</span>
            ${opt("program", "hit5", PROGRAMS.hit5.name, PROGRAMS.hit5.tagline + " — jede Muskelgruppe 1×/Woche.")}
            ${opt("program", "hybrid4", PROGRAMS.hybrid4.name, PROGRAMS.hybrid4.tagline + " — mehr Volumen pro Muskel.", true)}
          </section>
          <section>
            <span class="eyebrow">Nach dem Top-Set</span>
            ${opt("extra", "backoff", "Back-off-Satz", "90 s Pause, ~12 % weniger Gewicht, 6–10 Wdh. bis 1 Wdh. vor dem Versagen.", true)}
            ${opt("extra", "restpause", "Rest-Pause", "Gleiches Gewicht, zwei Mini-Blöcke nach je 15–20 Atemzügen. Zählt wie zwei harte Sätze.")}
            ${opt("extra", "none", "Nur das Top-Set", "Klassisches HIT nach Mentzer. Am schnellsten, aber am wenigsten Volumen.")}
          </section>
          <section>
            <span class="eyebrow">Ausbelastung im Top-Set</span>
            ${opt("effort", "failure", "Bis zum Muskelversagen", "Das Original — maximaler Reiz, längere Erholung.")}
            ${opt("effort", "rir", "1–2 Wdh. in Reserve", "Praktisch gleicher Aufbau, besser für Kraft und Regeneration.", true)}
          </section>
          <section>
            <span class="eyebrow">Design</span>
            <div class="seg">
              <button class="seg-btn ${state.theme === null ? "on" : ""}" data-act="theme" data-value="system">System</button>
              <button class="seg-btn ${state.theme === "light" ? "on" : ""}" data-act="theme" data-value="light">Hell</button>
              <button class="seg-btn ${state.theme === "dark" ? "on" : ""}" data-act="theme" data-value="dark">Dunkel</button>
            </div>
          </section>
          <p class="muted small">Die Empfehlungen folgen den Volumen- und Ausbelastungs-Meta-Analysen; die Belege stehen im Plan-Tab.</p>
        </div>
      </div>`;
  }

  function applySetting(group, value) {
    if (group === "program" && value !== state.settings.program && state.active) {
      if (!confirm("Programm wechseln? Das laufende Training wird verworfen.")) return;
      state.active = null;
      stopRest();
    }
    if (group === "extra" && state.active) {
      // Laufende Einheit an die neue Satzzahl anpassen, Erledigtes bleibt erhalten.
      state.settings.extra = value;
      const need = setCount();
      Object.values(state.active.sets).forEach((entry) => {
        while (entry.done.length < need) entry.done.push(false);
        entry.done.length = need;
      });
      state.active.extra = value;
      save();
      render();
      return;
    }
    state.settings[group] = value;
    save();
    render();
  }

  /* ------------------------------------------------------------- Steuerung */

  function render() {
    const main = document.getElementById("main");
    main.innerHTML = view === "today" ? renderToday() : view === "plan" ? renderPlan() : renderProgress();
    document.getElementById("sheet").innerHTML = sheetOpen ? renderSheet() : "";
    document.body.classList.toggle("locked", sheetOpen);
    document.getElementById("brand-sub").textContent = program().name;
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
    if (act === "timer-stop") { stopRest(); return; }
    if (act === "timer-plus") { timer.left += 30; renderTimer(); return; }

    if (act === "export") { exportData(); return; }
    if (act === "import") { importData(); return; }
    if (act === "reset") {
      if (confirm("Wirklich alle Trainingsdaten löschen?")) { state = emptyState(); save(); applyTheme(); render(); }
      return;
    }

    const card = btn.closest(".session-ex");
    if (!card || !state.active) return;
    const exId = card.dataset.ex;
    const entry = state.active.sets[exId];
    const step = EXERCISES[exId].step;

    if (act === "kg+" || act === "kg-") {
      const base = entry.kg || 0;
      entry.kg = Math.max(0, roundTo(base + (act === "kg+" ? step : -step), step));
      save(); render(); focusCard(exId);
      return;
    }
    if (act === "toggle") {
      const idx = Number(btn.dataset.idx);
      if (!entry.kg && !entry.done[idx]) { alert("Trag zuerst das Gewicht fürs Top-Set ein — die übrigen Sätze rechnet die App daraus."); return; }
      entry.done[idx] = !entry.done[idx];
      save(); render(); focusCard(exId);
      if (entry.done[idx]) {
        const sets = setsFor(exId, entry.kg);
        const cur = sets[idx];
        const next = sets[idx + 1];
        const label = next ? `Vor ${next.kind === "extra" ? next.label : "Satz " + next.nr}` : "Übungswechsel";
        startRest(Number(btn.dataset.rest) || cur.rest, label);
      }
    }
  });

  document.addEventListener("input", (ev) => {
    const input = ev.target.closest("[data-role]");
    if (!input || !state.active) return;
    const card = input.closest(".session-ex");
    if (!card) return;
    const exId = card.dataset.ex;
    const entry = state.active.sets[exId];

    if (input.dataset.role === "kg") {
      const val = parseFloat(input.value.replace(",", "."));
      entry.kg = isNaN(val) ? null : val;
      // Übrige Sätze live nachziehen, ohne die Karte neu zu bauen (Fokus bleibt im Feld)
      const sets = setsFor(exId, entry.kg);
      card.querySelectorAll(".ramp .set").forEach((row, idx) => {
        if (!sets[idx]) return;
        row.querySelector(".kg").innerHTML = `${sets[idx].kg !== null ? fmtKg(sets[idx].kg) : "—"} <em>kg</em>`;
      });
    } else if (input.dataset.role === "reps") {
      const val = parseInt(input.value, 10);
      entry.reps = isNaN(val) ? null : val;
      const v = verdictFor(entry);
      const box = card.querySelector(".result-row .verdict");
      if (box) { box.className = `verdict ${v.kind} grow-min`; box.textContent = v.text; }
    }
    save();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && sheetOpen) { sheetOpen = false; render(); }
  });

  function focusCard(exId) {
    const card = document.querySelector(`.session-ex[data-ex="${exId}"]`);
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ------------------------------------------------------ Import / Export */

  async function exportData() {
    const json = JSON.stringify(state, null, 2);
    const filename = `topset-hit-${new Date().toISOString().slice(0, 10)}.json`;

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
  render();
})();
