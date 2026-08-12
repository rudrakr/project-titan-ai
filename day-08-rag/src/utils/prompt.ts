import type { Chunk } from "../types.js";

export function buildPrompt(
  question: string,
  chunks: Chunk[]
): string {
  const context = chunks
    .map((chunk) => chunk.content)
    .join("\n\n");

  return `
You are an AI assistant.

Answer ONLY using the provided context.

If the answer is not present in the context,
reply:

"I could not find this information in the provided documents."

-----------------------
CONTEXT

${context}

-----------------------

QUESTION

${question}
`;
}