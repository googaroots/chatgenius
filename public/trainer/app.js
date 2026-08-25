/**
 * Top Set — HIT-Trainer für den Technogym 5er-Split
 * Alles läuft lokal im Browser, die Daten liegen in localStorage.
 */
(function () {
  "use strict";

  const { RAMP, EXERCISES, DAYS, REST_DAYS, WEEK_ORDER } = window.TG;
  const STORE_KEY = "topset-hit-v1";

  /* ---------------------------------------------------------------- Zustand */

  const emptyState = () => ({
    v: 1,
    theme: null,          // null = System, "dark" | "light"
    weights: {},          // exId -> { kg, reps, date }
    history: [],          // { id, date, dayId, entries: [{ exId, kg, reps }] }
    active: null          // laufendes Training
  });

  let state = load();
  let view = "today";

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return emptyState();
      return Object.assign(emptyState(), JSON.parse(raw));
    } catch (err) {
      return emptyState();
    }
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

  /** Aufwärmsätze aus dem Top-Set-Gewicht ableiten (50 / 70 / 85 / 100 %). */
  function rampFor(exId, topKg) {
    const step = EXERCISES[exId].step;
    return RAMP.map((s) => ({
      ...s,
      kg: topKg ? (s.top ? topKg : roundTo(topKg * s.pct, step)) : null
    }));
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

  function dayByWeekday(wd) { return DAYS.find((d) => d.weekday === wd) || null; }
  function dayById(id) { return DAYS.find((d) => d.id === id) || null; }

  function nextTrainingDay(fromWeekday) {
    for (let i = 1; i <= 7; i++) {
      const wd = (fromWeekday + i) % 7;
      const day = dayByWeekday(wd);
      if (day) return day;
    }
    return DAYS[0];
  }

  function lastSessionFor(dayId) {
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].dayId === dayId) return state.history[i];
    }
    return null;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  /* --------------------------------------------------------------- Training */

  function startSession(dayId) {
    const day = dayById(dayId);
    state.active = {
      dayId,
      startedAt: new Date().toISOString(),
      sets: Object.fromEntries(day.exercises.map((exId) => {
        const p = progression(exId);
        return [exId, { kg: p ? p.kg : null, reps: null, done: [false, false, false, false] }];
      }))
    };
    save();
    go("today");
  }

  function finishSession() {
    const act = state.active;
    if (!act) return;
    const day = dayById(act.dayId);
    const entries = day.exercises
      .map((exId) => ({ exId, ...act.sets[exId] }))
      .filter((e) => e.kg && e.done[3])
      .map((e) => ({ exId: e.exId, kg: e.kg, reps: e.reps || 0 }));

    if (entries.length) {
      state.history.push({
        id: act.startedAt,
        date: new Date().toISOString(),
        dayId: act.dayId,
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
      if (timer.left <= 0) {
        stopRest();
        signal();
        return;
      }
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
    if (!timer.id) { box.hidden = true; return; }
    box.hidden = false;
    box.classList.toggle("warn", timer.left <= 10);
    const m = Math.floor(timer.left / 60);
    const s = String(timer.left % 60).padStart(2, "0");
    box.querySelector(".timer-count").textContent = `${m}:${s}`;
    box.querySelector(".timer-label").textContent = timer.label;
  }

  /* ----------------------------------------------------------- Darstellung */

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function weekStrip(todayWd) {
    return `<ul class="daychips">${WEEK_ORDER.map((wd) => {
      const day = dayByWeekday(wd);
      const rest = REST_DAYS[wd];
      const cls = ["daychip", day ? "train" : "rest", wd === todayWd ? "today" : ""].join(" ");
      const name = day ? day.short : rest.short;
      return `<li class="${cls}" title="${esc(day ? day.title : "Pause")}">${name}</li>`;
    }).join("")}</ul>`;
  }

  function renderToday() {
    const now = new Date();
    const wd = now.getDay();
    const act = state.active;

    if (act) return renderSession();

    const day = dayByWeekday(wd);
    const strip = weekStrip(wd);

    if (!day) {
      const rest = REST_DAYS[wd];
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
          <h2 style="font-size:24px;text-transform:uppercase">${esc(next.weekdayName)} · ${esc(next.title)}</h2>
          <p class="muted" style="margin:0">${esc(next.subtitle)} — ${esc(next.focus)}.</p>
          <ul class="ex-list">${next.exercises.map((exId, i) => exRow(exId, i)).join("")}</ul>
          <button class="btn btn-ghost" data-act="start" data-day="${next.id}">Einheit trotzdem jetzt starten</button>
        </div>
        <div class="hintbox">Regeneration ist Teil des Plans: HIT lebt davon, dass das Top-Set am Trainingstag wirklich alles bekommt.</div>
      `;
    }

    const last = lastSessionFor(day.id);
    return `
      <div class="today-head">
        <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id} von 5</span>
        <h1>${esc(day.title)}</h1>
        <p class="sub">${esc(day.subtitle)}</p>
      </div>
      ${strip}
      <div class="focus-line"><span>Fokus: ${esc(day.focus)}. ${esc(day.logic)}.</span></div>
      <div class="card stack">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
          <span class="eyebrow">Heutige Übungen</span>
          <span class="muted data" style="font-size:12px">4 Übungen · ~45 Min</span>
        </div>
        <ul class="ex-list">${day.exercises.map((exId, i) => exRow(exId, i)).join("")}</ul>
        <button class="btn" data-act="start" data-day="${day.id}">Training starten</button>
        ${last ? `<p class="muted data" style="font-size:12px;margin:0">Zuletzt am ${formatDate(last.date)} absolviert</p>` : ""}
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
    const day = dayById(act.dayId);
    const total = day.exercises.length;
    const done = day.exercises.filter((exId) => act.sets[exId].done[3]).length;

    return `
      <div class="today-head">
        <span class="eyebrow">Training läuft · Tag ${day.id}</span>
        <h1>${esc(day.title)}</h1>
        <p class="sub">${esc(day.subtitle)} · <span class="data">${done}/${total}</span> Übungen im Kasten</p>
      </div>
      ${day.exercises.map((exId, i) => sessionCard(exId, i)).join("")}
      <div class="sheet-actions" style="margin-top:16px">
        <button class="btn btn-ghost" data-act="cancel">Abbrechen</button>
        <button class="btn" data-act="finish">Training abschließen</button>
      </div>
    `;
  }

  function sessionCard(exId, i) {
    const ex = EXERCISES[exId];
    const entry = state.active.sets[exId];
    const p = progression(exId);
    const sets = rampFor(exId, entry.kg);
    const doneCount = entry.done.filter(Boolean).length;

    return `
      <article class="session-ex ${entry.done[3] ? "" : "active"}" data-ex="${exId}">
        <header>
          <div class="grow">
            <h3>${String(i + 1).padStart(2, "0")} · ${esc(ex.name)}</h3>
            <div class="machine">${esc(ex.machine)} — ${esc(ex.target)}</div>
          </div>
          <span class="pill ${doneCount === 4 ? "pill-done" : ""}"><span class="data">${doneCount}/4</span></span>
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
              <div class="set ${s.top ? "top" : ""} ${entry.done[idx] ? "done" : ""}" data-set="${s.nr}">
                <span class="bar"></span>
                <span class="set-label">
                  <b>${s.nr}. ${esc(s.label)}</b>
                  <span>${esc(s.hint)}</span>
                </span>
                <span class="kg">${s.kg !== null ? fmtKg(s.kg) : "—"} <em>kg</em></span>
                <span class="reps">${s.reps} Wdh.</span>
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
              <div class="verdict ${verdictFor(entry).kind}" style="flex:1;min-width:180px">${esc(verdictFor(entry).text)}</div>
            </div>` : ""}
          <div class="hintbox"><b>Einstellung:</b> ${esc(ex.tip)}</div>
        </div>
      </article>`;
  }

  function verdictFor(entry) {
    if (!entry.reps) return { kind: "hold", text: "Trag ein, wie viele Wiederholungen du bis zum Versagen geschafft hast." };
    if (entry.reps >= 8) return { kind: "up", text: "8+ Wdh. — nächstes Mal geht mehr Gewicht." };
    if (entry.reps >= 6) return { kind: "hold", text: "Im Zielkorridor 6–8. Gewicht bleibt, bis 8 stehen." };
    return { kind: "down", text: "Unter 6 Wdh. — beim nächsten Mal etwas leichter für saubere Technik." };
  }

  function renderPlan() {
    return `
      <div class="today-head">
        <span class="eyebrow">5er-Split</span>
        <h1>Der Plan</h1>
        <p class="sub">High Intensity Training — ein Top-Set pro Übung bis zum Muskelversagen.</p>
      </div>

      <div class="card stack">
        <span class="eyebrow">Satz-Struktur pro Übung</span>
        <div class="ramp">
          ${RAMP.map((s) => `
            <div class="set ${s.top ? "top" : ""}" data-set="${s.nr}">
              <span class="bar"></span>
              <span class="set-label"><b>${s.nr}. ${esc(s.label)}</b><span>${esc(s.hint)}</span></span>
              <span class="kg">${Math.round(s.pct * 100)} <em>%</em></span>
              <span class="reps">${s.reps} Wdh.</span>
            </div>`).join("")}
        </div>
        <p class="muted" style="margin:0;font-size:13px">Pausen: 60 s · 90 s · 2,5 Min vor dem Top-Set · 3 Min danach.</p>
      </div>

      <div class="card stack">
        <span class="eyebrow">Wochenrhythmus</span>
        <div class="week">
          ${WEEK_ORDER.map((wd) => {
            const day = dayByWeekday(wd);
            if (!day) {
              const r = REST_DAYS[wd];
              return `<div class="week-row pause"><span class="wd">${r.short}</span>
                        <span><b>Pause</b><br><span class="why">${esc(r.logic)}</span></span></div>`;
            }
            return `<div class="week-row"><span class="wd">${day.short}</span>
                      <span><b>Tag ${day.id}: ${esc(day.title)}</b><br><span class="why">${esc(day.logic)}</span></span></div>`;
          }).join("")}
        </div>
      </div>

      ${DAYS.map((day) => `
        <div class="card stack">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
            <span class="eyebrow">${esc(day.weekdayName)} · Tag ${day.id}</span>
            <span class="muted" style="font-size:12px">${esc(day.subtitle)}</span>
          </div>
          <h2 style="font-size:24px;text-transform:uppercase">${esc(day.title)}</h2>
          <p class="muted" style="margin:0;font-size:14px">Fokus: ${esc(day.focus)}</p>
          <div>
            ${day.exercises.map((exId) => {
              const ex = EXERCISES[exId];
              return `<details class="acc">
                <summary><b>${esc(ex.name)}</b><span class="machine">${esc(ex.machine)}</span></summary>
                <div class="acc-body">
                  <span><b>Ziel-Muskel:</b> ${esc(ex.target)}</span>
                  <span><b>Ablauf:</b> 3 Aufwärmsätze + 1 × 6–8 Wdh. (Max)</span>
                  <span><b>Einstellung:</b> ${esc(ex.tip)}</span>
                  <span><b>HIT-Vorteil:</b> ${esc(ex.hit)}</span>
                </div>
              </details>`;
            }).join("")}
          </div>
          <button class="btn btn-ghost" data-act="start" data-day="${day.id}">Diese Einheit starten</button>
        </div>`).join("")}
    `;
  }

  /** Bewegte Last: unter 10 t in kg, darüber in Tonnen. */
  function fmtVolume(kg) {
    if (kg < 10000) return `${Math.round(kg)}<span style="font-size:13px"> kg</span>`;
    return `${(kg / 1000).toFixed(1).replace(".", ",")}<span style="font-size:13px"> t</span>`;
  }

  function renderProgress() {
    const sessions = state.history.length;
    const tracked = Object.keys(state.weights).length;
    const volume = state.history.reduce((sum, s) => sum + s.entries.reduce((v, e) => v + e.kg * (e.reps || 0), 0), 0);

    const perExercise = Object.keys(EXERCISES).map((exId) => {
      const hist = state.history
        .flatMap((s) => s.entries.filter((e) => e.exId === exId).map((e) => ({ ...e, date: s.date })))
        .slice(-5);
      return { exId, hist, best: hist.length ? Math.max(...hist.map((h) => h.kg)) : null };
    }).filter((row) => row.hist.length);

    return `
      <div class="today-head">
        <span class="eyebrow">Verlauf</span>
        <h1>Fortschritt</h1>
        <p class="sub">Beim HIT zählt genau eine Zahl pro Übung: das Top-Set.</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="v">${sessions}</div><div class="k">Einheiten</div></div>
        <div class="stat"><div class="v">${tracked}</div><div class="k">Übungen</div></div>
        <div class="stat"><div class="v">${fmtVolume(volume)}</div><div class="k">Volumen</div></div>
      </div>

      ${perExercise.length ? `
        <div class="card">
          <span class="eyebrow">Top-Set je Übung</span>
          <div style="margin-top:8px">
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
        </div>` : `<div class="card muted">Noch keine abgeschlossene Einheit. Nach dem ersten Training stehen hier deine Top-Sets und die Vorschläge fürs nächste Mal.</div>`}

      ${sessions ? `
        <div class="card">
          <span class="eyebrow">Letzte Einheiten</span>
          <div style="margin-top:8px">
            ${state.history.slice(-10).reverse().map((s) => {
              const day = dayById(s.dayId);
              return `<div class="log-entry">
                <div class="head"><b>${esc(day ? day.title : "Training")}</b><span class="date">${formatDate(s.date)}</span></div>
                <div class="sets">${s.entries.map((e) => `${esc(EXERCISES[e.exId].name)}: ${fmtKg(e.kg)} kg × ${e.reps}`).join(" · ")}</div>
              </div>`;
            }).join("")}
          </div>
        </div>` : ""}

      <div class="card stack">
        <span class="eyebrow">Daten</span>
        <p class="muted" style="margin:0;font-size:14px">Alles liegt nur in diesem Browser. Exportiere deinen Verlauf, bevor du das Gerät wechselst.</p>
        <div class="sheet-actions">
          <button class="btn btn-ghost btn-sm" data-act="export">Exportieren</button>
          <button class="btn btn-ghost btn-sm" data-act="import">Importieren</button>
          <button class="btn btn-ghost btn-sm" data-act="reset">Zurücksetzen</button>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------- Steuerung */

  function render() {
    const main = document.getElementById("main");
    main.innerHTML = view === "today" ? renderToday() : view === "plan" ? renderPlan() : renderProgress();
    document.querySelectorAll(".tab").forEach((t) => {
      t.setAttribute("aria-selected", String(t.dataset.view === view));
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function go(next) { view = next; render(); }

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
    const card = btn.closest(".session-ex");
    const exId = card ? card.dataset.ex : null;

    if (act === "start") { startSession(Number(btn.dataset.day)); return; }
    if (act === "finish") { finishSession(); stopRest(); return; }
    if (act === "cancel") {
      if (confirm("Training verwerfen? Die eingetragenen Sätze gehen verloren.")) {
        state.active = null; save(); stopRest(); go("today");
      }
      return;
    }
    if (act === "theme") {
      state.theme = state.theme === "dark" ? "light" : state.theme === "light" ? null : "dark";
      applyTheme(); save();
      btn.textContent = state.theme === "dark" ? "☾" : state.theme === "light" ? "☀" : "◐";
      btn.title = "Design: " + (state.theme || "System");
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

    if (!exId) return;
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
      if (!entry.kg && !entry.done[idx]) { alert("Trag zuerst das Gewicht fürs Top-Set ein — die Aufwärmsätze rechnet die App daraus."); return; }
      entry.done[idx] = !entry.done[idx];
      save(); render(); focusCard(exId);
      if (entry.done[idx]) {
        const rest = Number(btn.dataset.rest);
        const label = idx === 3 ? "Übungswechsel" : `Vor Satz ${idx + 2}`;
        startRest(rest, label);
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
      // Aufwärmsätze live nachziehen, ohne die Karte neu zu bauen (Fokus bleibt im Feld)
      const sets = rampFor(exId, entry.kg);
      card.querySelectorAll(".ramp .set").forEach((row, idx) => {
        row.querySelector(".kg").innerHTML = `${sets[idx].kg !== null ? fmtKg(sets[idx].kg) : "—"} <em>kg</em>`;
      });
    } else if (input.dataset.role === "reps") {
      const val = parseInt(input.value, 10);
      entry.reps = isNaN(val) ? null : val;
      const v = verdictFor(entry);
      const box = card.querySelector(".result-row .verdict");
      if (box) { box.className = `verdict ${v.kind}`; box.textContent = v.text; box.style.flex = "1"; box.style.minWidth = "180px"; }
    }
    save();
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
          state = Object.assign(emptyState(), data);
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
  const themeBtn = document.querySelector('[data-act="theme"]');
  if (themeBtn) {
    themeBtn.textContent = state.theme === "dark" ? "☾" : state.theme === "light" ? "☀" : "◐";
    themeBtn.title = "Design: " + (state.theme || "System");
  }
  render();
})();
