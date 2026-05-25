import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { config } from "./config";
import { chatRouter } from "./routes/chat";
import { knowledgeRouter } from "./routes/knowledge";
import { analyticsRouter } from "./routes/analytics";
import { requestLogger } from "./middleware/analytics";

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Logging
app.use(morgan("dev"));
app.use(requestLogger);

// Widget-Datei öffentlich bereitstellen
app.use("/widget.js", express.static(path.join(__dirname, "..", "public", "widget.js")));

// Routes
app.use("/chat", chatRouter);
app.use("/knowledge", knowledgeRouter);
app.use("/analytics", analyticsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", model: config.anthropic.model, ts: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(config.server.port, () => {
  console.log(`ChatGenius API running on http://localhost:${config.server.port}`);
  console.log(`Model: ${config.anthropic.model}`);
  console.log(`Vector index: ${config.chroma.persistPath}`);
});
