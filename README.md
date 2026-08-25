# ChatGenius — AI Customer Support API

TypeScript REST API powered by **Claude** (Anthropic) with RAG via **ChromaDB**.  
Migrated from OpenAI GPT-4 → `claude-opus-4-7`.

---

## Stack

| Layer | Technology |
|---|---|
| LLM | Claude `claude-opus-4-7` via `@anthropic-ai/sdk` |
| Vector DB | ChromaDB (local or remote) |
| Server | Express + TypeScript |
| Streaming | Server-Sent Events (SSE) |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Start ChromaDB (Docker)
docker run -p 8000:8000 chromadb/chroma

# 4. Start dev server
npm run dev

# 5. Or build for production
npm run build && npm start
```

---

## API Endpoints

### Chat

**POST /chat**

```json
{
  "message": "How do I reset my password?",
  "sessionId": "optional-existing-session-id",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "language": "German",
  "stream": false
}
```

Response:
```json
{
  "sessionId": "uuid",
  "response": "To reset your password...",
  "handoffRequested": false,
  "usage": { "inputTokens": 820, "outputTokens": 134 }
}
```

Set `"stream": true` to get a Server-Sent Events response instead.  
SSE event types: `text` | `handoff` | `done`.

**POST /chat/:sessionId/resolve** — mark a conversation as resolved.

---

### Knowledge Base

**POST /knowledge/ingest** — add documents for RAG retrieval.

```json
{
  "documents": [
    {
      "content": "Password reset: Go to Settings → Security → Reset Password.",
      "metadata": { "source": "help-center", "category": "account" }
    }
  ]
}
```

**DELETE /knowledge/:id** — remove a document.

**GET /knowledge/stats** — document count in ChromaDB.

---

### Analytics

| Endpoint | Description |
|---|---|
| `GET /analytics/summary` | Aggregate stats (resolution rate, handoff rate, token usage) |
| `GET /analytics/sessions` | All session records |
| `GET /analytics/sessions/:id` | Single session detail |

---

### Health

**GET /health** — liveness check.

---

## Key Features

- **Prompt caching** — system prompt + knowledge base context cached with `cache_control: {type: "ephemeral"}` (~90% token cost reduction on repeated queries)
- **Adaptive thinking** — `thinking: {type: "adaptive"}` for complex reasoning
- **Human handoff** — Claude uses a tool call to signal when a human agent is needed; payload forwarded to your helpdesk webhook
- **CRM integration** — conversation lifecycle events (`started`, `ended`, `handoff_triggered`, `question_answered`) posted to your CRM webhook
- **Multi-language** — Claude detects the user's language automatically or you can pin a language per request
- **Streaming** — SSE streaming for long responses

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PORT` | No | Server port (default: 3000) |
| `CHROMA_HOST` | No | ChromaDB host (default: localhost) |
| `CHROMA_PORT` | No | ChromaDB port (default: 8000) |
| `CHROMA_COLLECTION` | No | Collection name (default: chatgenius_kb) |
| `HANDOFF_WEBHOOK_URL` | No | Helpdesk webhook for human handoff |
| `HANDOFF_API_KEY` | No | Auth token for handoff webhook |
| `CRM_WEBHOOK_URL` | No | CRM webhook for conversation events |
| `CRM_API_KEY` | No | Auth token for CRM webhook |

---

## Trainings-App `/trainer`

Statische Web-App für ein **evidenzbasiertes Krafttraining an Technogym-Geräten**.
Läuft ohne Build-Schritt und ohne Backend — die App wird vom Express-Server unter
`/trainer/` ausgeliefert und kann alternativ direkt als `public/trainer/index.html`
im Browser geöffnet werden.

```bash
npm run dev            # danach: http://localhost:3000/trainer/
```

| Datei | Inhalt |
|---|---|
| `public/trainer/plan.js` | Programm, 27 Übungen (Technogym-Geräte plus Langhantel/Kurzhantel) mit Muskelzuordnung, Begründung, Ersatzübung, Belege |
| `public/trainer/art.js` | Piktogramme aller Übungen als SVG (eigene Zeichnungen, kein fremdes Bildmaterial) |
| `public/trainer/app.js` | Logik: Sitzung, Gewichtsberechnung, Progression, Volumenrechnung, Timer, Verlauf |
| `public/trainer/app.css` | Design-Tokens, dunkles und helles Theme |
| `public/trainer/index.html` | Grundgerüst und Tab-Navigation |

**Das Programm** — Oberkörper/Unterkörper an vier Tagen (Mo / Di / Do / Fr), jede
Muskelgruppe zweimal pro Woche, 2–3 Arbeitssätze je Übung im Bereich 6–15
Wiederholungen mit 1–2 Wiederholungen in Reserve. Überwiegend Technogym-Geräte;
freie Gewichte dort, wo die Vergleichsstudien genau diese Variante geprüft haben
(rumänisches Kreuzheben, Hip Thrust, Schrägbank-Curl). Ergibt 7–14 harte Sätze je Muskel
und Woche und liegt damit im Korridor, für den die Volumen-Meta-Analysen den größten
Zuwachs zeigen.

**Was die App macht**

- **Heute** — zeigt anhand des Wochentags die fällige Einheit mit Sätzen, Zielspanne
  und Gewichtsvorschlag (an Pausentagen die Vorschau auf das nächste Training).
- **Piktogramm je Übung** — Gerät, Körperhaltung und Bewegungsrichtung als SVG, in der
  Tagesliste, in der laufenden Einheit und im Plan-Tab.
- **Aufwärmsätze rechnen sich selbst** — zwei kurze Sätze mit 50 % und 75 % des
  Arbeitsgewichts, standardmäßig vor der ersten Übung je Körperregion; umstellbar auf
  jede Übung oder ganz aus.
- **Doppelte Progression** — obere Grenze der Wiederholungsspanne im letzten Satz
  erreicht → nächstes Mal ein Gewichtssprung (2,5 kg, bei Leg Press und Calf 5 kg);
  unter der unteren Grenze → 10 % zurück.
- **Pausen-Timer** — startet beim Abhaken eines Satzes: 45–60 s nach Aufwärmsätzen,
  90 s nach isolierten, 2,5 Min nach schweren Sätzen.
- **Volumen-Auswertung** — harte Sätze je Muskel und Woche gegen den Zielkorridor
  10–20; direkt belastete Muskeln zählen voll, indirekt beteiligte zur Hälfte,
  Aufwärmsätze gar nicht.
- **Verlauf** — Gewicht und Wiederholungen je Übung mit Verlaufskurve, Bestwerte,
  bewegte Last, Export/Import als JSON.
- **Geräteeinstellungen merken** — Notiz je Übung (Sitzhöhe, Lehne, Griff), sichtbar
  in der Tagesliste, der laufenden Einheit und im Plan-Tab.
- **Entlastungswoche** — nach 8 Trainingswochen schlägt die App eine leichte Woche
  vor (halbe Satzzahl, 10 % weniger Gewicht) und setzt den Zähler danach zurück.
- **Körpergewicht** — wöchentlicher Eintrag mit Kurve und 4-Wochen-Trend.
- **Installierbar (PWA)** — Manifest, Icon und Service Worker; über HTTPS ausgeliefert
  lässt sich die App aufs Handy installieren und läuft offline.

Der Plan-Tab führt die Belege auf — zur Programm-Struktur (Krieger 2010, Pelland et al.
2024/25, Refalo et al. 2023, Schoenfeld et al. 2017 und 2019) und zur Übungsauswahl:
sitzender statt liegender Beinbeuger (Maeo et al. 2021), Trizeps über Kopf statt
Pushdown (Maeo et al. 2023), Wadenheben stehend statt sitzend (Kinoshita et al. 2023),
Preacher- und Kabel-Curl für verschiedene Bizeps-Abschnitte (Kassiano et al. 2025),
Schrägdrücken für die obere Brust (Chaves et al. 2020), Hip Thrust als
Gesäßübung erster Wahl (Krause Neto et al. 2025). Maschine oder freies Gewicht macht
für den Muskelaufbau keinen bedeutsamen Unterschied (Haugen et al. 2023) — die Wahl
fällt daher je Übung auf die Variante mit der besseren Studienlage.

Jede der 24 Übungen trägt eine Begründung und eine Ersatzübung, falls das Gerät
besetzt ist — sichtbar im Plan-Tab und während der laufenden Einheit.

Alle Daten liegen ausschließlich im `localStorage` des Browsers; die App sendet nichts
an den Server. Ältere gespeicherte Stände werden beim Laden migriert, Gewichte und
Verlauf bleiben dabei erhalten.
