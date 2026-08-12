import { createChunks } from "./utils/chunk.js";
import { createEmbeddings } from "./services/embed.js";
import { retrieveChunks } from "./services/retrieve.js";
import { buildPrompt } from "./utils/prompt.js";
import { askClaude } from "./services/claude.js";
import { extractText } from "./utils/extract-text.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function main() {
  const documentPath = "docs/company-policy.txt";

  const text = await extractText(documentPath);

  console.log("📄 Creating chunks...");
  const chunks = createChunks(text, documentPath);

  console.log("🧠 Creating embeddings...");
  const embeddedChunks = await createEmbeddings(chunks);

  const rl = readline.createInterface({
    input,
    output,
  });

  while (true) {
    const question = await rl.question(
      "?? Ask a question: (type 'exit' to quit) :  ",
    );

    if (question.toLowerCase() === "exit") {
      break;
    }
    console.log("🔍 Retrieving relevant chunks...");
    const topChunks = await retrieveChunks(question, embeddedChunks);

    console.log("\n📚 Retrieved Chunks:");
    console.log(topChunks);

    console.log("\n📝 Building prompt...");
    const prompt = buildPrompt(question, topChunks);

    // Uncomment if you want to see the full prompt
    // console.log(prompt);

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
