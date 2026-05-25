import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface ConversationRecord {
  sessionId: string;
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  handoffTriggered: boolean;
  languages: string[];
  resolved: boolean;
}

// In-memory store — replace with a database for production
const conversations = new Map<string, ConversationRecord>();

export function getOrCreateSession(sessionId?: string): string {
  const id = sessionId ?? uuidv4();
  if (!conversations.has(id)) {
    conversations.set(id, {
      sessionId: id,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      messageCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      handoffTriggered: false,
      languages: [],
      resolved: false,
    });
  }
  return id;
}

export function recordMessage(
  sessionId: string,
  tokens: { input: number; output: number },
  handoff: boolean,
  language?: string
): void {
  const record = conversations.get(sessionId);
  if (!record) return;

  record.messageCount += 1;
  record.totalInputTokens += tokens.input;
  record.totalOutputTokens += tokens.output;
  record.lastActivityAt = new Date().toISOString();
  if (handoff) record.handoffTriggered = true;
  if (language && !record.languages.includes(language)) {
    record.languages.push(language);
  }
}

export function markResolved(sessionId: string): void {
  const record = conversations.get(sessionId);
  if (record) record.resolved = true;
}

export function getSession(sessionId: string): ConversationRecord | undefined {
  return conversations.get(sessionId);
}

export function getAllSessions(): ConversationRecord[] {
  return Array.from(conversations.values());
}

export function getSummaryStats() {
  const all = getAllSessions();
  const total = all.length;
  const resolved = all.filter((s) => s.resolved).length;
  const handoffs = all.filter((s) => s.handoffTriggered).length;
  const totalMessages = all.reduce((sum, s) => sum + s.messageCount, 0);
  const totalInputTokens = all.reduce((sum, s) => sum + s.totalInputTokens, 0);
  const totalOutputTokens = all.reduce((sum, s) => sum + s.totalOutputTokens, 0);

  return {
    totalSessions: total,
    resolvedSessions: resolved,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    handoffRate: total > 0 ? Math.round((handoffs / total) * 100) : 0,
    averageMessagesPerSession: total > 0 ? Math.round(totalMessages / total) : 0,
    totalInputTokens,
    totalOutputTokens,
  };
}

// Express middleware: attach request ID and log duration
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}
