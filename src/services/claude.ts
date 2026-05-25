import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { retrieveContext } from "./rag";
import type { Response } from "express";

export const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  sessionId: string;
  history: Message[];
  userMessage: string;
  language?: string;
}

export interface ChatResult {
  content: string;
  handoffRequested: boolean;
  handoffReason?: string;
  inputTokens: number;
  outputTokens: number;
}

// Tool definition for human handoff detection
const handoffTool: Anthropic.Tool = {
  name: "request_human_handoff",
  description:
    "Call this when the user's issue is too complex, emotionally charged, requires account access, " +
    "involves legal/billing disputes, or when the user explicitly asks to speak with a human agent.",
  input_schema: {
    type: "object" as const,
    properties: {
      reason: {
        type: "string",
        description: "Brief explanation of why human intervention is needed",
      },
      urgency: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Urgency level of the handoff",
      },
      summary: {
        type: "string",
        description: "Short summary of the conversation so far for the human agent",
      },
    },
    required: ["reason", "urgency", "summary"],
  },
};

function buildSystemPrompt(context: string, language?: string): string {
  const languageInstruction = language
    ? `\nIMPORTANT: Always respond in ${language}.`
    : "\nDetect the language the user writes in and respond in that same language.";

  return (
    `You are ChatGenius, an expert AI customer support assistant. ` +
    `Your goal is to help users quickly and accurately, drawing on the knowledge base provided below.\n\n` +
    `Guidelines:\n` +
    `- Be concise, friendly, and professional\n` +
    `- Use the knowledge base context to answer accurately; never fabricate information\n` +
    `- If you cannot find a reliable answer in the context, say so honestly\n` +
    `- If the issue requires account access, is a billing dispute, involves legal matters, ` +
    `or the user is upset and explicitly asks for a human, use the request_human_handoff tool\n` +
    languageInstruction +
    `\n\n--- KNOWLEDGE BASE ---\n${context || "No relevant documents found."}\n--- END KNOWLEDGE BASE ---`
  );
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  const { history, userMessage, language } = options;

  // Retrieve relevant context from ChromaDB
  const retrieved = await retrieveContext(userMessage);
  const context = retrieved
    .map((r, i) => `[${i + 1}] ${r.content}`)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(context, language);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache system prompt + knowledge base context — ~90% cost reduction on repeated calls
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [handoffTool],
    messages,
  });

  let content = "";
  let handoffRequested = false;
  let handoffReason: string | undefined;

  for (const block of response.content) {
    if (block.type === "text") {
      content += block.text;
    } else if (block.type === "tool_use" && block.name === "request_human_handoff") {
      handoffRequested = true;
      const input = block.input as { reason: string; urgency: string; summary: string };
      handoffReason = `[${input.urgency.toUpperCase()}] ${input.reason} — ${input.summary}`;
    }
  }

  return {
    content: content.trim(),
    handoffRequested,
    handoffReason,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function chatStream(
  options: ChatOptions,
  res: Response
): Promise<{ handoffRequested: boolean; handoffReason?: string; inputTokens: number; outputTokens: number }> {
  const { history, userMessage, language } = options;

  const retrieved = await retrieveContext(userMessage);
  const context = retrieved
    .map((r, i) => `[${i + 1}] ${r.content}`)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(context, language);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  // Send SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let handoffRequested = false;
  let handoffReason: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = anthropic.messages.stream({
    model: config.anthropic.model,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [handoffTool],
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      res.write(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
    }

    if (event.type === "message_stop") {
      const final = await stream.finalMessage();
      inputTokens = final.usage.input_tokens;
      outputTokens = final.usage.output_tokens;

      for (const block of final.content) {
        if (block.type === "tool_use" && block.name === "request_human_handoff") {
          handoffRequested = true;
          const input = block.input as { reason: string; urgency: string; summary: string };
          handoffReason = `[${input.urgency.toUpperCase()}] ${input.reason} — ${input.summary}`;
          res.write(`data: ${JSON.stringify({ type: "handoff", reason: handoffReason })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: "done", inputTokens, outputTokens })}\n\n`);
      res.end();
    }
  }

  return { handoffRequested, handoffReason, inputTokens, outputTokens };
}
