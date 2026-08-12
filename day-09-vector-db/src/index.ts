import { createChunks } from "./utils/chunk.js";
import { createEmbeddings } from "./services/embed.js";
import { extractText } from "./utils/extract-text.js";
import { resetCollection, storeEmbeddings } from "./services/vector-db.js";
import { retrieveChunks } from "./services/retrieve.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Chunk } from "./types.js";
import { buildPrompt } from "./utils/prompt.js";
import { askClaude } from "./services/claude.js";

async function main() {
  const documentPath = "docs/company-policy.txt";

  console.log("📄 Extracting text...");

  const text = await extractText(documentPath);

  console.log("✂️ Creating chunks...");

  const chunks = createChunks(text, documentPath);

  console.log(`Created ${chunks.length} chunks.`);

  console.log("🧠 Creating embeddings...");

  const embeddedChunks = await createEmbeddings(chunks);

  console.log(`Created ${embeddedChunks.length} embeddings.`);

  console.log("🗑️ Resetting ChromaDB collection...");

  await resetCollection();

  console.log("🗄️ Storing embeddings in ChromaDB...");

  await storeEmbeddings(embeddedChunks);

  console.log("🎉 Day 9 storage complete!");

  const rl = readline.createInterface({
    input,
    output,
  });

  while (true) {
    const question = await rl.question(
      "\n❓ Ask a question (type 'exit' to quit): ",
    );

    if (question.toLowerCase() === "exit") {
      break;
    }

    console.log("\n🔍 Retrieving relevant chunks...");

    const topChunks = await retrieveChunks(question, 3);

    console.log("\n📚 Retrieved Chunks:");
    console.dir(topChunks, { depth: null });

    console.log("\n📝 Building prompt...");

    const prompt = buildPrompt(question, topChunks);

    console.log("\n🤖 Asking Claude...");

    const answer = await askClaude(prompt);

    console.log("\n==============================");
    console.log("✅ Claude's Answer");
    console.log("==============================");
    console.log(answer);
  }
  rl.close();
}
main().catch(console.error);
