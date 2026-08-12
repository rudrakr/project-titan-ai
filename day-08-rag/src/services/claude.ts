import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function askClaude(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const textBlock = msg.content.find((block) => block.type === "text");

  if (!textBlock) {
    throw new Error("No text response from Claude.");
  }

  return textBlock.text;
}
