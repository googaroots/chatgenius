(function () {
  "use strict";

  // ── Konfiguration ──────────────────────────────────────────────────────────
  var API_URL = window.CHATGENIUS_API_URL || "http://localhost:3000";
  var TITLE   = window.CHATGENIUS_TITLE   || "Support Chat";
  var COLOR   = window.CHATGENIUS_COLOR   || "#0057b7";
  // ──────────────────────────────────────────────────────────────────────────

  if (document.getElementById("cg-root")) return; // doppeltes Laden verhindern

  // ── Styles ─────────────────────────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent = [
    "#cg-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:" + COLOR + ";border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:9998;}",
    "#cg-btn svg{width:26px;height:26px;fill:#fff;}",
    "#cg-panel{position:fixed;bottom:92px;right:24px;width:360px;height:520px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:flex;flex-direction:column;z-index:9999;overflow:hidden;transition:opacity .2s,transform .2s;}",
    "#cg-panel.cg-hidden{opacity:0;transform:translateY(12px);pointer-events:none;}",
    "#cg-header{background:" + COLOR + ";color:#fff;padding:14px 16px;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center;}",
    "#cg-header button{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:0;}",
    "#cg-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f7f8fa;}",
    ".cg-msg{max-width:82%;padding:9px 12px;border-radius:10px;font-size:14px;line-height:1.45;word-break:break-word;}",
    ".cg-msg.user{align-self:flex-end;background:" + COLOR + ";color:#fff;border-bottom-right-radius:2px;}",
    ".cg-msg.bot{align-self:flex-start;background:#fff;color:#222;border:1px solid #e2e4e8;border-bottom-left-radius:2px;}",
    ".cg-msg.bot.typing{color:#999;}",
    "#cg-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e4e8;background:#fff;}",
    "#cg-input{flex:1;border:1px solid #ccc;border-radius:6px;padding:8px 10px;font-size:14px;outline:none;resize:none;height:38px;}",
    "#cg-input:focus{border-color:" + COLOR + ";}",
    "#cg-send{background:" + COLOR + ";color:#fff;border:none;border-radius:6px;padding:0 14px;cursor:pointer;font-size:18px;}",
    "#cg-send:disabled{opacity:.45;cursor:default;}",
    "@media(max-width:420px){#cg-panel{width:calc(100vw - 20px);right:10px;bottom:80px;}}"
  ].join("");
  document.head.appendChild(style);

  // ── Markup ─────────────────────────────────────────────────────────────────
  var root = document.createElement("div");
  root.id = "cg-root";
  root.innerHTML = [
    '<button id="cg-btn" aria-label="Chat öffnen">',
    '  <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>',
    '</button>',
    '<div id="cg-panel" class="cg-hidden" role="dialog" aria-label="' + TITLE + '">',
    '  <div id="cg-header">',
    '    <span>' + TITLE + '</span>',
    '    <button id="cg-close" aria-label="Schließen">&times;</button>',
    '  </div>',
    '  <div id="cg-messages"></div>',
    '  <form id="cg-form" onsubmit="return false">',
    '    <input id="cg-input" type="text" placeholder="Nachricht…" autocomplete="off">',
    '    <button id="cg-send" type="submit">&#10148;</button>',
    '  </form>',
    '</div>'
  ].join("");
  document.body.appendChild(root);

  // ── State ──────────────────────────────────────────────────────────────────
  var sessionId = null;
  var isOpen    = false;
  var isBusy    = false;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  var panel    = document.getElementById("cg-panel");
  var messages = document.getElementById("cg-messages");
  var input    = document.getElementById("cg-input");
  var sendBtn  = document.getElementById("cg-send");

  // ── Helpers ────────────────────────────────────────────────────────────────
  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle("cg-hidden", !isOpen);
    if (isOpen) {
      input.focus();
      if (messages.children.length === 0) addBotMsg("Hallo! Wie kann ich dir helfen?");
    }
  }

  function addUserMsg(text) {
    var p = document.createElement("div");
    p.className = "cg-msg user";
    p.textContent = text;
    messages.appendChild(p);
    scrollBottom();
    return p;
  }

  function addBotMsg(text) {
    var p = document.createElement("div");
    p.className = "cg-msg bot";
    p.textContent = text || "…";
    if (!text) p.classList.add("typing");
    messages.appendChild(p);
    scrollBottom();
    return p;
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(busy) {
    isBusy = busy;
    sendBtn.disabled = busy;
    input.disabled   = busy;
  }

  // ── Senden ─────────────────────────────────────────────────────────────────
  async function send() {
    var text = input.value.trim();
    if (!text || isBusy) return;
    input.value = "";
    addUserMsg(text);

    var botEl = addBotMsg("");
    setBusy(true);

    var body = { message: text, stream: true };
    if (sessionId) body.sessionId = sessionId;

    try {
      var res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        botEl.textContent = "Fehler " + res.status + " — bitte versuche es erneut.";
        return;
      }

      var reader  = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer  = "";
      var hasText = false;

      while (true) {
        var _ref = await reader.read(), done = _ref.done, value = _ref.value;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop();

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.startsWith("data: ")) continue;
          var event;
          try { event = JSON.parse(line.slice(6)); } catch (e) { continue; }

          if (event.type === "text") {
            if (!hasText) { botEl.classList.remove("typing"); hasText = true; }
            botEl.textContent += event.text;
            scrollBottom();
          }
          if (event.type === "done" && event.sessionId) {
            sessionId = event.sessionId;
          }
          if (event.type === "handoff") {
            botEl.textContent += "\n\nEin Mitarbeiter wird sich in Kürze bei dir melden.";
          }
        }
      }

      if (!hasText) botEl.textContent = "Entschuldigung, ich konnte keine Antwort generieren.";

    } catch (err) {
      botEl.textContent = "Verbindungsfehler: " + err.message;
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  document.getElementById("cg-btn").addEventListener("click", togglePanel);
  document.getElementById("cg-close").addEventListener("click", togglePanel);
  document.getElementById("cg-form").addEventListener("submit", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

})();
