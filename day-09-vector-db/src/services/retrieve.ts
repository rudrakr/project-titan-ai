import { ChromaClient } from "chromadb";
import { createEmbeddings } from "./embed.js";
import type { Chunk } from "../types.js";

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

export async function retrieveChunks(
  question: string,
  topK: number = 3,
): Promise<Chunk[]> {
  // 1. Get our ChromaDB collection
  const collection = await chroma.getCollection({
    name: "company-policies",
  });

  // 2. Convert the question into a temporary Chunk
  const questionChunk: Chunk = {
    id: -1,
    title: "User Question",
    content: question,
    source: "query",
  };

  // 3. Create the question embedding using Voyage
  const embeddedQuestion = await createEmbeddings([questionChunk]);

  // 4. Get the actual vector
  const questionEmbedding = embeddedQuestion[0]?.embedding;

  if (!questionEmbedding) {
    throw new Error("Could not create question embedding.");
  }

  // 5. Ask ChromaDB for the most similar chunks
  const results = await collection.query({
    queryEmbeddings: [questionEmbedding],
    nResults: topK,
  });

  console.log("\n🔍 ChromaDB results:");
  console.dir(results, { depth: null });

  const documents = results.documents?.[0] ?? [];
  const ids = results.ids?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];

  const chunks: Chunk[] = documents.map((document, index) => ({
    id: Number(ids[index]),
    title: String(metadatas[index]?.title ?? ""),
    content: document,
    source: String(metadatas[index]?.source ?? ""),
  }));

  return chunks;
}
