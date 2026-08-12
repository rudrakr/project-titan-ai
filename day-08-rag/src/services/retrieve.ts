import { VoyageAIClient } from "voyageai";
import dotenv from "dotenv";
import { similarity } from "../utils/similarity.js";

import type { EmbeddedChunk, SearchResult, Chunk } from "../types.js";

dotenv.config();

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

export async function retrieveChunks(
  question: string,
  embeddedChunks: EmbeddedChunk[],
): Promise<Chunk[]> {
  const response = await voyage.embed({
    input: question,
    model: "voyage-3.5-lite",
    inputType: "query",
  });

  if (!response.data) {
    throw new Error("Query embedding missing");
  }

  const queryEmbedding = response.data[0]?.embedding;

  if (!queryEmbedding) {
    throw new Error("Query vector missing");
  }

  const results: SearchResult[] = embeddedChunks.map((item) => {
    const score = similarity(queryEmbedding, item.embedding);

    return {
      chunk: item.chunk,
      score,
    };
  });

  results.sort((a, b) => b.score - a.score);

  const topChunks = results.slice(0, 3).map((result) => result.chunk);

  return topChunks;
}
