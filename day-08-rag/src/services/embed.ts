import { VoyageAIClient } from "voyageai";
import dotenv from "dotenv";

import type { Chunk, EmbeddedChunk } from "../types.js";

dotenv.config();

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

export async function createEmbeddings(
  chunks: Chunk[],
): Promise<EmbeddedChunk[]> {
  const documents = chunks.map((chunk) => `${chunk.title}\n${chunk.content}`);

  const response = await voyage.embed({
    input: documents,
    model: "voyage-3.5-lite",
    inputType: "document",
  });
  if (!response.data) {
    throw new Error("Voyage did not return embeddings.");
  }
//   console.dir(response, { depth: null });
  const embeddings = response.data;
  const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, index) => {
    const embeddingItem = embeddings[index];

    if (!embeddingItem) {
      throw new Error(`Missing embedding at index ${index}`);
    }

    if (!embeddingItem.embedding) {
      throw new Error(`Embedding vector missing at index ${index}`);
    }

    return {
      chunk,
      embedding: embeddingItem.embedding,
    };
  });

  return embeddedChunks;
}
