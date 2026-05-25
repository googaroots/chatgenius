import { config } from "../config";

export interface HandoffPayload {
  sessionId: string;
  reason: string;
  conversationSummary: string;
  userMessage: string;
  history: Array<{ role: string; content: string }>;
  timestamp: string;
}

export interface HandoffResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

export async function triggerHandoff(payload: HandoffPayload): Promise<HandoffResult> {
  const { webhookUrl, apiKey } = config.handoff;

  if (!webhookUrl) {
    // No webhook configured — log and return a stub ticket ID for dev/testing
    console.warn("[handoff] HANDOFF_WEBHOOK_URL not set; handoff not forwarded");
    return { success: true, ticketId: `LOCAL-${Date.now()}` };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Webhook returned ${response.status}: ${body}` };
    }

    const data = (await response.json()) as { ticketId?: string; id?: string };
    return { success: true, ticketId: data.ticketId ?? data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
