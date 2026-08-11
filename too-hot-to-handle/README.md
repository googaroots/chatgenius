# Too Hot to Handle — Das Spiel

Ein interaktives Reality-Show-Spiel im Browser, gebaut mit **Next.js 16**, **React 19**,
**TypeScript** und **Tailwind CSS 4**. Neun Tage Retreat, 100.000 € gemeinsames Preisgeld und
eine KI namens Lana, die jede Berührung abrechnet.

> Fan-Projekt ohne Verbindung zu Netflix. Cast und Handlung sind frei erfunden.

---

## Schnellstart

```bash
npm install
npm run dev      # http://localhost:3000
```

Weitere Skripte:

| Befehl              | Zweck                            |
| ------------------- | -------------------------------- |
| `npm run build`     | Produktions-Build                |
| `npm run start`     | Produktionsserver                |
| `npm run typecheck` | TypeScript ohne Emit prüfen      |

Es gibt kein Backend, keine Datenbank und keine Umgebungsvariablen. Alles läuft im Browser,
der Spielstand liegt in `localStorage`.

---

## Spielprinzip

- **Preisgeld** startet bei 100.000 €. Regelverstöße kosten sofort:
  Kuss 3.000 €, Heavy Petting 6.000 €, Sex 20.000 €, Selbstbefriedigung 2.000 €.
- **Entwicklung** steigt durch Workshops, ehrliche Gespräche und ausgeschlagene Versuchungen.
- **Ansehen** bildet ab, wie die Gruppe dich sieht.
- **Verbindungen** wachsen pro Person (0–100). Die stärkste wird dein Fokus.
- Ab Tag 5 und 6 kommen zwei Neuzugänge, die bestehende Konstellationen sprengen.
- Nach Tag 9 wertet Lana aus: **sieben mögliche Enden**, von „Der teuerste Urlaub deines
  Lebens“ bis „Retreat-Legende“.

Die Auszahlung ergibt sich aus Entwicklung, Ansehen, stärkster Verbindung und dem, was vom
Pott übrig ist — abzüglich eines Malus pro Regelverstoß. Ein Durchlauf ohne Verstoß und mit
grünem Licht zahlt am besten.

---

## Aufbau

```
src/
  app/
    page.tsx            Landingpage
    cast/page.tsx       Cast-Profile
    regeln/page.tsx     Lanas Regelwerk
    spielen/page.tsx    Einstieg ins Spiel
    layout.tsx          Rahmen, Navigation, Metadaten
    globals.css         Tailwind-Theme, Hintergrund, Animationen
  components/
    Game.tsx            Zustandsmaschine der Oberfläche (Setup → Szene → Finale)
    Setup.tsx           Charaktererstellung
    Hud.tsx             Preisgeld, Tag, Entwicklung, Ansehen
    SpeakerBubble.tsx   Sprecherblase inkl. Lana-Darstellung
    ChoiceList.tsx      Auswahlbuttons mit Risiko-Label
    Connections.tsx     Verbindungswerte der Villa
    Finale.tsx          Abschlusszeremonie und Protokoll
  game/
    types.ts            Datentypen
    rules.ts            Konstanten, Kosten, Regeltexte
    engine.ts           Reducer, Szenenauswahl, Finale-Berechnung
    storage.ts          Autosave über localStorage
    data/cast.ts        Zehn Kandidat:innen
    data/scenes.ts      Alle Szenen und Entscheidungen
```

Die gesamte Spiellogik steckt in `src/game/`. Die Komponenten rendern nur, was der Reducer
liefert — das Verhalten lässt sich also ohne UI-Änderungen anpassen.

---

## Inhalte erweitern

Eine neue Szene ist ein Eintrag in `src/game/data/scenes.ts`:

```ts
{
  id: "d3-poolparty",
  day: 3,
  title: "Poolparty",
  speaker: "narrator",           // "lana" | "narrator" | Contestant-ID
  condition: (s) => s.trust > 60, // optional
  choices: [
    {
      id: "mitmachen",
      label: "Mitfeiern",
      risk: "flirty",             // safe | growth | flirty | rulebreak
      outcome: "Was danach passiert …",
      lana: "Optionaler Kommentar von Lana",
      effects: { growth: 5, trust: -2, connection: 10, ruleBreak: "kuss" },
    },
  ],
}
```

`effects.ruleBreak` zieht den passenden Betrag automatisch ab. `effects.target` lenkt die
Verbindung auf eine bestimmte Person, sonst zählt sie auf den aktuellen Fokus.

Neue Kandidat:innen kommen in `src/game/data/cast.ts`; `arrivesOnDay` steuert, ab wann sie in
der Verbindungsliste auftauchen.

---

## Steuerung

- Tasten `1`–`4` wählen eine Option.
- `Enter` / `Leertaste` blättern weiter.
- Der Spielstand wird automatisch gesichert; beim nächsten Besuch fragt das Spiel, ob es
  fortgesetzt werden soll.

---

## Deployment

Statisch genug für jede Node-Umgebung:

```bash
npm run build && npm run start   # Port über -p, z. B. npm run start -- -p 8080
```

Auf Vercel genügt das Verzeichnis `too-hot-to-handle` als Root — es sind keine
Umgebungsvariablen nötig.
