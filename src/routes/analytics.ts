import { Router, Request, Response } from "express";
import {
  getAllSessions,
  getSession,
  getSummaryStats,
} from "../middleware/analytics";

export const analyticsRouter = Router();

// GET /analytics/summary — aggregate stats across all sessions
analyticsRouter.get("/summary", (_req: Request, res: Response) => {
  res.json(getSummaryStats());
});

// GET /analytics/sessions — list all session records
analyticsRouter.get("/sessions", (_req: Request, res: Response) => {
  res.json(getAllSessions());
});

// GET /analytics/sessions/:sessionId — detail for a single session
analyticsRouter.get("/sessions/:sessionId", (req: Request, res: Response) => {
  const record = getSession(req.params.sessionId);
  if (!record) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(record);
});
