import { config } from "../config";

export type CRMEventType =
  | "conversation_started"
  | "conversation_ended"
  | "handoff_triggered"
  | "question_answered";

export interface CRMEvent {
  eventType: CRMEventType;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface CRMResult {
  success: boolean;
  error?: string;
}

export async function sendCRMEvent(event: CRMEvent): Promise<CRMResult> {
  const { webhookUrl, apiKey } = config.crm;

  if (!webhookUrl) {
    console.warn("[crm] CRM_WEBHOOK_URL not set; event not forwarded:", event.eventType);
    return { success: true };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `CRM webhook returned ${response.status}: ${body}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
