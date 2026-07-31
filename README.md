# ChatGenius — AI Customer Support API

TypeScript REST API powered by **Claude** (Anthropic) with RAG via **ChromaDB**.  
Migrated from OpenAI GPT-4 → `claude-opus-4-7`.

Der Server hostet zusätzlich **„Blind Verliebt — Österreich“** — ein Dating-Formatkonzept samt
Website und spielbarer Pod-Demo. Siehe [Blind Verliebt — Österreich](#blind-verliebt--österreich)
und [`docs/KONZEPT.md`](docs/KONZEPT.md).

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

## Blind Verliebt — Österreich

Ein eigenständiges Dating-Formatkonzept für Österreich, das auf demselben Server läuft:
zuerst reden, dann verlieben, dann erst schauen. Die Website erklärt das Format nicht nur —
sie macht es spielbar.

> Eigenständiges Konzept ohne Verbindung zu bestehenden Sendern oder Streaming-Diensten.
> Alle Kandidat:innen der Pod-Demo sind erfunden und werden von Claude gespielt.

### Seiten

| Pfad | Inhalt |
|---|---|
| `/` | Landingpage: Prinzip, Österreich-Adaption, sechs Phasen, Fürsorge-Regeln, FAQ |
| `/konzept.html` | Ausführliches Konzept: Staffelaufbau, Casting, Produktion, Recht |
| `/pod.html` | Pod-Demo: zehn Minuten Blind-Chat mit Verbindungsmesser, Antrag und Reveal |
| `/bewerbung.html` | Casting-Formular mit serverseitiger Validierung |

Start: `npm run dev` und dann `http://localhost:3000/` öffnen.
Das Konzeptdokument liegt unter [`docs/KONZEPT.md`](docs/KONZEPT.md).

### Pod-Endpunkte

| Endpunkt | Beschreibung |
|---|---|
| `POST /pods` | Date starten — `{ vorname, praeferenz: "frauen"\|"maenner"\|"alle", ausschluss?: string[] }` |
| `GET /pods/:podId` | Stand des Dates inklusive Restzeit und Verbindungswert |
| `POST /pods/:podId/nachricht` | Nachricht senden; SSE-Events: `text`, `verbindung`, `antrag`, `pod_verlassen`, `done`, `error` |
| `POST /pods/:podId/antrag` | `{ entscheidung: "ja"\|"nein" }` — bei Ja kommt der Reveal-Steckbrief |
| `GET /pods/statistik/gesamt` | Aggregierte Kennzahlen der Demo |

```bash
curl -X POST localhost:3000/pods \
  -H 'Content-Type: application/json' \
  -d '{"vorname":"Anna","praeferenz":"maenner"}'
```

### Casting-Endpunkte

| Endpunkt | Beschreibung |
|---|---|
| `POST /casting/bewerbung` | Bewerbung einreichen (Alter ≥ 18, Heiratsabsicht und Datenschutz Pflicht) |
| `GET /casting/statistik` | Nur aggregierte Zahlen — keine Personendaten |
| `GET /casting/bundeslaender` | Auswahlliste fürs Formular |

### Wie die Pods funktionieren

- `src/services/personas.ts` — acht erfundene Kandidat:innen mit Herkunft, Beruf, Sprachstil,
  Werten, Dealbreakern und einem Reveal-Steckbrief.
- `src/services/pods.ts` — Rollen-Prompt mit Prompt-Caching, Zeitlimit (10 Minuten), SSE-Streaming.
  Claude meldet über Tools zurück: `verbindungs_update` (Gefühlslage 0–100), `antrag_stellen`
  (ab Verbindung ≥ 82 und sechs eigenen Zügen), `pod_verlassen` (Grenzüberschreitung/Dealbreaker).
- Aussehen, Stil und Reveal-Ort verlassen den Server erst nach einem angenommenen Antrag.

Pods und Bewerbungen liegen ausschließlich im Arbeitsspeicher und sind nach einem Neustart weg.
