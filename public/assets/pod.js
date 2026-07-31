/* Pod-Demo: Gespräch durch die Wand.
   Spricht mit den /pods-Endpunkten des ChatGenius-Servers. */

(function () {
  "use strict";

  var pod = null;            // { podId, partnerVorname, ... }
  var gesehenePersonas = []; // damit ein neuer Pod jemand anderen bringt
  var uhrTimer = null;

  var el = function (id) { return document.getElementById(id); };

  // ---------------------------------------------------------------- Anzeige

  function blase(klasse, text) {
    var div = document.createElement("div");
    div.className = "blase " + klasse;
    div.textContent = text;
    el("verlauf").appendChild(div);
    scrollen();
    return div;
  }

  function scrollen() {
    var v = el("verlauf");
    v.scrollTop = v.scrollHeight;
  }

  function verbindungSetzen(wert, grund) {
    el("verbindung-wert").textContent = String(wert);
    el("verbindung-balken").style.width = wert + "%";
    if (grund) el("verbindung-grund").textContent = grund;
  }

  function uhrFormat(sekunden) {
    var m = Math.floor(sekunden / 60);
    var s = sekunden % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function uhrStarten(sekunden) {
    clearInterval(uhrTimer);
    var rest = sekunden;
    var anzeige = el("uhr");

    var tick = function () {
      anzeige.textContent = uhrFormat(Math.max(0, rest));
      anzeige.classList.toggle("knapp", rest <= 60);
      if (rest <= 0) {
        clearInterval(uhrTimer);
        eingabeSperren(true);
        blase("regie", "Die Zeit im Pod ist um.");
      }
      rest -= 1;
    };

    tick();
    uhrTimer = setInterval(tick, 1000);
  }

  function eingabeSperren(gesperrt) {
    el("nachricht").disabled = gesperrt;
    el("senden-btn").disabled = gesperrt;
  }

  // ------------------------------------------------------------------ Setup

  el("setup-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var vorname = el("vorname").value.trim();
    var fehler = el("setup-fehler");

    if (vorname.length < 2) {
      fehler.textContent = "Bitte gib deinen Vornamen an.";
      fehler.classList.remove("versteckt");
      return;
    }

    fehler.classList.add("versteckt");
    el("setup-btn").disabled = true;
    el("setup-btn").textContent = "Die Wand fährt hoch…";

    fetch("/pods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vorname: vorname,
        praeferenz: el("praeferenz").value,
        ausschluss: gesehenePersonas
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Der Pod ließ sich nicht öffnen (" + res.status + ").");
        return res.json();
      })
      .then(function (daten) {
        pod = daten;
        if (daten.personaId) gesehenePersonas.push(daten.personaId);
        datenAnzeigen(daten);
      })
      .catch(function (err) {
        fehler.textContent = err.message;
        fehler.classList.remove("versteckt");
      })
      .finally(function () {
        el("setup-btn").disabled = false;
        el("setup-btn").textContent = "Pod betreten";
      });
  });

  function datenAnzeigen(daten) {
    el("setup").classList.add("versteckt");
    el("date").classList.remove("versteckt");

    el("partner-name").textContent = daten.partnerVorname;
    el("partner-info").textContent = "Du siehst nur diese Wand.";
    el("verlauf").innerHTML = "";
    el("antrag-box").classList.add("versteckt");
    el("reveal-box").classList.add("versteckt");
    eingabeSperren(false);

    blase("regie", "Du sitzt im Pod. Hinter der Wand: " + daten.partnerVorname + ".");
    (daten.verlauf || []).forEach(function (m) {
      blase(m.role === "user" ? "ich" : "sie", m.content);
    });

    verbindungSetzen(daten.verbindung, daten.verbindungGrund);
    uhrStarten(daten.verbleibendeSekunden);
    el("nachricht").focus();
  }

  // ------------------------------------------------------------- Nachrichten

  el("nachricht-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!pod) return;

    var eingabe = el("nachricht");
    var text = eingabe.value.trim();
    if (!text) return;

    eingabe.value = "";
    eingabeSperren(true);
    blase("ich", text);

    var antwort = blase("sie", "…");
    var ersterText = true;

    fetch("/pods/" + pod.podId + "/nachricht", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, stream: true })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (fehler) {
            throw new Error(fehler.error || "Die Leitung in den Pod ist gestört.");
          });
        }
        return stromLesen(res, antwort, function () {
          if (ersterText) { antwort.textContent = ""; ersterText = false; }
        });
      })
      .catch(function (err) {
        antwort.textContent = "[" + err.message + "]";
      })
      .finally(function () {
        if (pod && pod.status === "offen") {
          eingabeSperren(false);
          el("nachricht").focus();
        }
      });
  });

  function stromLesen(res, antwortEl, vorErstemText) {
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var puffer = "";

    var weiter = function () {
      return reader.read().then(function (ergebnis) {
        if (ergebnis.done) return;

        puffer += decoder.decode(ergebnis.value, { stream: true });
        var zeilen = puffer.split("\n");
        puffer = zeilen.pop();

        zeilen.forEach(function (zeile) {
          if (zeile.indexOf("data: ") !== 0) return;
          var ereignis;
          try { ereignis = JSON.parse(zeile.slice(6)); } catch (e) { return; }
          ereignisVerarbeiten(ereignis, antwortEl, vorErstemText);
        });

        return weiter();
      });
    };

    return weiter();
  }

  function ereignisVerarbeiten(ereignis, antwortEl, vorErstemText) {
    if (ereignis.type === "text") {
      vorErstemText();
      antwortEl.textContent += ereignis.text;
      scrollen();
      return;
    }

    if (ereignis.type === "verbindung") {
      verbindungSetzen(ereignis.verbindung, ereignis.grund);
      return;
    }

    if (ereignis.type === "antrag") {
      antragAnzeigen(ereignis.text);
      return;
    }

    if (ereignis.type === "pod_verlassen") {
      blase("regie", "Die Tür auf der anderen Seite geht. " + (ereignis.grund || ""));
      eingabeSperren(true);
      clearInterval(uhrTimer);
      return;
    }

    if (ereignis.type === "error") {
      antwortEl.textContent = "[" + ereignis.error + "]";
      return;
    }

    if (ereignis.type === "done") {
      if (!pod) return; // Pod wurde während des Streams verlassen
      pod.status = ereignis.status;
      if (ereignis.status !== "offen") {
        eingabeSperren(true);
        clearInterval(uhrTimer);
      }
    }
  }

  // ---------------------------------------------------------------- Antrag

  function antragAnzeigen(text) {
    el("antrag-text").textContent = text || "";
    el("antrag-box").classList.remove("versteckt");
    blase("regie", pod.partnerVorname + " hat dir einen Antrag gemacht.");
  }

  function antragBeantworten(entscheidung) {
    el("ja-btn").disabled = true;
    el("nein-btn").disabled = true;
    eingabeSperren(true);
    clearInterval(uhrTimer);

    blase("ich", entscheidung === "ja" ? "Ja. Ich will." : "Es tut mir leid — nein.");

    fetch("/pods/" + pod.podId + "/antrag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entscheidung: entscheidung })
    })
      .then(function (res) { return res.json(); })
      .then(function (daten) {
        if (daten.error) throw new Error(daten.error);
        blase("sie", daten.reaktion);
        el("antrag-box").classList.add("versteckt");

        if (daten.reveal) {
          revealAnzeigen(daten.reveal);
        } else {
          blase("regie", "Ihr werdet einander nie sehen.");
        }
      })
      .catch(function (err) {
        blase("regie", "[" + err.message + "]");
      });
  }

  el("ja-btn").addEventListener("click", function () { antragBeantworten("ja"); });
  el("nein-btn").addEventListener("click", function () { antragBeantworten("nein"); });

  function revealAnzeigen(reveal) {
    var dl = el("reveal-daten");
    dl.innerHTML = "";

    var zeilen = [
      ["Name", reveal.vorname + ", " + reveal.alter],
      ["Zuhause", reveal.ort],
      ["Beruf", reveal.beruf],
      ["Erscheinung", reveal.erscheinung],
      ["Stil", reveal.stil],
      ["Ort des Reveals", reveal.revealOrt]
    ];

    zeilen.forEach(function (zeile) {
      var dt = document.createElement("dt");
      dt.textContent = zeile[0];
      var dd = document.createElement("dd");
      dd.textContent = zeile[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    el("reveal-box").classList.remove("versteckt");
    blase("regie", "Die Wand fährt hoch. Du siehst " + reveal.vorname + " zum ersten Mal.");
  }

  // ------------------------------------------------------------- Neuer Pod

  el("neuer-pod").addEventListener("click", function () {
    clearInterval(uhrTimer);
    pod = null;
    el("ja-btn").disabled = false;
    el("nein-btn").disabled = false;
    el("date").classList.add("versteckt");
    el("setup").classList.remove("versteckt");
    el("vorname").focus();
  });
})();
