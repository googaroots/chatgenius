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
