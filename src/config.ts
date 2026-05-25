import "dotenv/config";

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  anthropic: {
    apiKey: require_env("ANTHROPIC_API_KEY"),
    model: "claude-opus-4-7" as const,
  },
  server: {
    port: parseInt(process.env.PORT ?? "3000", 10),
    env: process.env.NODE_ENV ?? "development",
  },
  chroma: {
    // Local file path for in-process persistent storage (no Docker/server needed)
    persistPath: process.env.CHROMA_PERSIST_PATH ?? "./chroma_data",
    collection: process.env.CHROMA_COLLECTION ?? "chatgenius_kb",
  },
  handoff: {
    webhookUrl: process.env.HANDOFF_WEBHOOK_URL,
    apiKey: process.env.HANDOFF_API_KEY,
  },
  crm: {
    webhookUrl: process.env.CRM_WEBHOOK_URL,
    apiKey: process.env.CRM_API_KEY,
  },
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS ?? "90", 10),
  },
} as const;
