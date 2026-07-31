/* Casting-Formular: füllt die Bundesland-Liste und schickt die Bewerbung an /casting/bewerbung. */

(function () {
  "use strict";

  var el = function (id) { return document.getElementById(id); };

  // Bundesländer vom Server holen, damit Formular und Validierung nie auseinanderlaufen
  fetch("/casting/bundeslaender")
    .then(function (res) { return res.json(); })
    .then(function (daten) {
      var select = el("bundesland");
      (daten.bundeslaender || []).forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
    })
    .catch(function () {
      el("fehler").textContent = "Die Bundesland-Liste konnte nicht geladen werden.";
      el("fehler").classList.remove("versteckt");
    });

  el("bewerbung-form").addEventListener("submit", function (e) {
    e.preventDefault();

    var fehler = el("fehler");
    fehler.classList.add("versteckt");

    var daten = {
      vorname: el("vorname").value.trim(),
      nachname: el("nachname").value.trim(),
      email: el("email").value.trim(),
      alter: parseInt(el("alter").value, 10),
      bundesland: el("bundesland").value,
      sucht: el("sucht").value,
      beruf: el("beruf").value.trim(),
      motivation: el("motivation").value.trim(),
      dealbreaker: el("dealbreaker").value.trim(),
      bereitFuerHochzeit: el("bereitFuerHochzeit").checked,
      datenschutz: el("datenschutz").checked
    };

    if (!daten.bereitFuerHochzeit) {
      return zeigeFehler("Ohne ernsthafte Heiratsabsicht ist eine Teilnahme nicht möglich.");
    }
    if (!daten.datenschutz) {
      return zeigeFehler("Bitte stimme der Verarbeitung deiner Daten zu.");
    }
    if (daten.motivation.length < 40) {
      return zeigeFehler("Bitte schreib zur Motivation mindestens 40 Zeichen.");
    }

    el("absenden").disabled = true;
    el("absenden").textContent = "Wird gesendet…";

    fetch("/casting/bewerbung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daten)
    })
      .then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (antwort) {
        if (!antwort.ok) throw new Error(fehlertextAus(antwort.body));

        el("bewerbung-form").classList.add("versteckt");
        el("erfolg").classList.remove("versteckt");
        el("erfolg-text").textContent =
          antwort.body.nachricht + " Nächster Schritt: " + antwort.body.naechsterSchritt + ".";
        el("erfolg-id").textContent = "Bewerbungsnummer: " + antwort.body.id;
        el("erfolg").scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (err) {
        zeigeFehler(err.message);
      })
      .finally(function () {
        el("absenden").disabled = false;
        el("absenden").textContent = "Bewerbung abschicken";
      });
  });

  function fehlertextAus(body) {
    if (!body) return "Die Bewerbung konnte nicht gesendet werden.";
    if (body.details) {
      var erstesFeld = Object.keys(body.details)[0];
      if (erstesFeld) return erstesFeld + ": " + body.details[erstesFeld][0];
    }
    return body.error || "Die Bewerbung konnte nicht gesendet werden.";
  }

  function zeigeFehler(text) {
    var fehler = el("fehler");
    fehler.textContent = text;
    fehler.classList.remove("versteckt");
  }
})();
