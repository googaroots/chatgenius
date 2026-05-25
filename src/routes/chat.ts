import { Router, Request, Response } from "express";
import { z } from "zod";
import { chat, chatStream, type Message } from "../services/claude";
import { triggerHandoff } from "../services/handoff";
import { sendCRMEvent } from "../services/crm";
import {
  getOrCreateSession,
  recordMessage,
  getSession,
  markResolved,
} from "../middleware/analytics";

export const chatRouter = Router();

const chatBodySchema = z.object({
  message: z.string().min(1).max(8000),
  sessionId: z.string().nullish(), // null oder undefined → neue Session
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  language: z.string().optional(),
  stream: z.boolean().optional().default(false),
});

chatRouter.post("/", async (req: Request, res: Response) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { message, sessionId: rawSessionIdRaw, history, language, stream } = parsed.data;
  const rawSessionId = rawSessionIdRaw ?? undefined; // null → undefined → neue Session
  const sessionId = getOrCreateSession(rawSessionId);

  // Notify CRM on first message of a new session
  if (!rawSessionId) {
    await sendCRMEvent({
      eventType: "conversation_started",
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (stream) {
      // Streaming path — response is SSE
      const result = await chatStream(
        { sessionId, history: history as Message[], userMessage: message, language },
        res
      );

      recordMessage(
        sessionId,
        { input: result.inputTokens, output: result.outputTokens },
        result.handoffRequested,
        language
      );

      if (result.handoffRequested) {
        const session = getSession(sessionId);
        await triggerHandoff({
          sessionId,
          reason: result.handoffReason ?? "Unknown",
          conversationSummary: result.handoffReason ?? "",
          userMessage: message,
          history: session
            ? (history as Message[])
            : [],
          timestamp: new Date().toISOString(),
        });
        await sendCRMEvent({
          eventType: "handoff_triggered",
          sessionId,
          metadata: { reason: result.handoffReason },
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }

    // Non-streaming path
    const result = await chat({
      sessionId,
      history: history as Message[],
      userMessage: message,
      language,
    });

    recordMessage(
      sessionId,
      { input: result.inputTokens, output: result.outputTokens },
      result.handoffRequested,
      language
    );

    if (result.handoffRequested) {
      const session = getSession(sessionId);
      const handoffResult = await triggerHandoff({
        sessionId,
        reason: result.handoffReason ?? "Unknown",
        conversationSummary: result.handoffReason ?? "",
        userMessage: message,
        history: session ? (history as Message[]) : [],
        timestamp: new Date().toISOString(),
      });
      await sendCRMEvent({
        eventType: "handoff_triggered",
        sessionId,
        metadata: { reason: result.handoffReason, ticketId: handoffResult.ticketId },
        timestamp: new Date().toISOString(),
      });
    } else {
      await sendCRMEvent({
        eventType: "question_answered",
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      sessionId,
      response: result.content,
      handoffRequested: result.handoffRequested,
      handoffReason: result.handoffReason,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });
  } catch (err) {
    console.error("[chat] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

chatRouter.post("/:sessionId/resolve", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  markResolved(sessionId);
  await sendCRMEvent({
    eventType: "conversation_ended",
    sessionId,
    metadata: { resolved: true },
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, sessionId });
});
