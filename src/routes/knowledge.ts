import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  ingestDocuments,
  deleteDocument,
  getCollectionStats,
} from "../services/rag";

export const knowledgeRouter = Router();

const ingestBodySchema = z.object({
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        content: z.string().min(1).max(100_000),
        metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      })
    )
    .min(1)
    .max(100),
});

// POST /knowledge/ingest — add or update documents in the knowledge base
knowledgeRouter.post("/ingest", async (req: Request, res: Response) => {
  const parsed = ingestBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const docs = parsed.data.documents.map((d) => ({
    id: d.id ?? uuidv4(),
    content: d.content,
    metadata: d.metadata,
  }));

  try {
    await ingestDocuments(docs);
    res.json({ success: true, ingested: docs.length, ids: docs.map((d) => d.id) });
  } catch (err) {
    console.error("[knowledge] Ingest error:", err);
    res.status(500).json({ error: "Failed to ingest documents" });
  }
});

// DELETE /knowledge/:id — remove a document from the knowledge base
knowledgeRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteDocument(id);
    res.json({ success: true, id });
  } catch (err) {
    console.error("[knowledge] Delete error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// GET /knowledge/stats — collection metadata
knowledgeRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getCollectionStats();
    res.json(stats);
  } catch (err) {
    console.error("[knowledge] Stats error:", err);
    res.status(500).json({ error: "Failed to retrieve stats" });
  }
});
