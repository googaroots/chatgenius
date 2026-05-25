import { LocalIndex, MetadataTypes } from "vectra";
import { pipeline } from "@huggingface/transformers";
import path from "path";
import { config } from "../config";

// Lazy-loaded embedding pipeline (downloads ~23 MB model on first run, then cached)
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

async function embed(text: string): Promise<number[]> {
  const pipe = await getEmbedder();
  // Cast to any — the pipeline union type is too wide for TS to unify call signatures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (pipe as any)(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

// Lazy-loaded vectra index
let index: LocalIndex | null = null;

async function getIndex(): Promise<LocalIndex> {
  if (index) return index;

  const indexPath = path.resolve(config.chroma.persistPath);
  index = new LocalIndex(indexPath);

  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }

  return index;
}

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, MetadataTypes>;
}

export interface RetrievalResult {
  content: string;
  metadata: Record<string, MetadataTypes>;
  score: number;
}

export async function ingestDocuments(documents: Document[]): Promise<void> {
  const idx = await getIndex();

  await idx.beginUpdate();
  try {
    for (const doc of documents) {
      const vector = await embed(doc.content);
      await idx.upsertItem({
        id: doc.id,
        vector,
        metadata: {
          content: doc.content,
          ...(doc.metadata ?? {}),
        },
      });
    }
    await idx.endUpdate();
  } catch (err) {
    await idx.cancelUpdate();
    throw err;
  }
}

export async function retrieveContext(
  query: string,
  topK = 5
): Promise<RetrievalResult[]> {
  const idx = await getIndex();

  const stats = await idx.getIndexStats();
  if (stats.items === 0) return [];

  const queryVector = await embed(query);
  // queryItems signature: (vector, query, topK, filter?, isBm25?)
  const results = await idx.queryItems(queryVector, query, topK);

  return results.map((r) => ({
    content: String(r.item.metadata?.content ?? ""),
    metadata: r.item.metadata ?? {},
    score: r.score,
  }));
}

export async function deleteDocument(id: string): Promise<void> {
  const idx = await getIndex();
  await idx.deleteItem(id);
}

export async function getCollectionStats(): Promise<{ count: number }> {
  const idx = await getIndex();
  const stats = await idx.getIndexStats();
  return { count: stats.items };
}
