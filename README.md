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

Statische Web-App für **HIT-Training an Technogym-Geräten**. Läuft ohne Build-Schritt
und ohne Backend — die App wird vom Express-Server unter `/trainer/` ausgeliefert und
kann alternativ direkt als `public/trainer/index.html` im Browser geöffnet werden.

```bash
npm run dev            # danach: http://localhost:3000/trainer/
```

| Datei | Inhalt |
|---|---|
| `public/trainer/plan.js` | Plandaten: zwei Programme, 20 Technogym-Übungen, Satz-Rampe, Muskelzuordnung, Belege |
| `public/trainer/app.js` | Logik: Sitzung, Gewichtsberechnung, Progression, Volumenrechnung, Timer, Verlauf |
| `public/trainer/app.css` | Design-Tokens, dunkles und helles Theme |
| `public/trainer/index.html` | Grundgerüst und Tab-Navigation |

**Was die App macht**

- **Heute** — zeigt anhand des Wochentags die fällige Einheit (an Pausentagen die
  Regenerationsbegründung und eine Vorschau auf das nächste Training).
- **Aufwärmsätze rechnen sich selbst** — ein eingetragenes Top-Set-Gewicht ergibt die
  Rampe 50 % / 70 % / 85 % / 100 %, gerundet auf den Gewichtssprung des Geräts
  (2,5 kg, bei Leg Press und Calf 5 kg).
- **Zusatzvolumen nach dem Top-Set** — wahlweise ein Back-off-Satz (≈ 88 % des
  Top-Set-Gewichts, 6–10 Wdh.) oder ein Rest-Pause-Durchgang; beides wird mitgerechnet
  und mitgeloggt. Abschaltbar für klassisches Ein-Satz-HIT.
- **Zwei Programme** — der ursprüngliche 5er-Split (Mo/Mi/Fr/Sa/So, jede Muskelgruppe
  einmal pro Woche) und ein Hybrid über vier Tage, der jede Muskelgruppe zweimal trifft.
- **Progression nach HIT-Logik** — 8+ Wdh. im Top-Set → nächstes Mal ein Sprung mehr,
  6–7 Wdh. → Gewicht halten, unter 6 → 10 % zurück.
- **Ausbelastung wählbar** — bis zum Muskelversagen oder mit 1–2 Wiederholungen in
  Reserve; die Satzbeschreibung passt sich an.
- **Pausen-Timer** — startet automatisch beim Abhaken eines Satzes
  (60 s / 90 s / 2,5 Min vor dem Top-Set / 2 Min vor dem Zusatzsatz / 3 Min zum Wechsel).
- **Volumen-Auswertung** — harte Sätze je Muskel und Woche gegen den Zielkorridor
  10–20; direkt belastete Muskeln zählen voll, indirekt beteiligte zur Hälfte.
- **Verlauf** — Top-Set je Übung, Bestwerte, bewegte Last, Export/Import als JSON.

Die Voreinstellungen und der Plan-Tab („Studienlage in fünf Punkten") folgen den
Volumen- und Ausbelastungs-Meta-Analysen (Krieger 2010, Pelland et al. 2024/25,
Refalo et al. 2023, Schoenfeld et al. 2019, Tsartsapakis et al. 2026).

Alle Daten liegen ausschließlich im `localStorage` des Browsers; die App sendet nichts
an den Server. Ein laufendes Training übersteht einen Reload.
