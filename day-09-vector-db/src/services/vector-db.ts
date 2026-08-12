import { ChromaClient } from "chromadb";
import type { EmbeddedChunk } from "../types.js";

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

export async function getCollection() {
  return await chroma.getOrCreateCollection({
    name: "company-policies",
    embeddingFunction: null,
  });
}

export async function resetCollection() {
  try {
    await chroma.deleteCollection({
      name: "company-policies",
    });

    console.log("🗑️ Deleted existing ChromaDB collection");
  } catch {
    console.log("ℹ️ Collection did not exist");
  }
}

export async function storeEmbeddings(
  embeddedChunks: EmbeddedChunk[],
) {
  const collection = await getCollection();

  await collection.upsert({
    ids: embeddedChunks.map((item) =>
      String(item.chunk.id),
    ),

    embeddings: embeddedChunks.map(
      (item) => item.embedding,
    ),

    documents: embeddedChunks.map(
      (item) => item.chunk.content,
    ),

    metadatas: embeddedChunks.map((item) => ({
      title: item.chunk.title,
      source: item.chunk.source,
    })),
  });

  console.log(
    `✅ Stored ${embeddedChunks.length} embeddings in ChromaDB`,
  );
}