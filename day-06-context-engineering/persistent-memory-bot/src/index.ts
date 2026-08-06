import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

import fs from "fs";

const raw = fs.readFileSync("./memory/user.json", "utf-8");

const user = JSON.parse(raw);

console.log(user);

const client = new Anthropic();
const question = "What should I study next?";

const prompt = `
You are my AI mentor.

Student Name: ${user.name}

Goal: ${user.goal}

Current Day: ${user.currentDay}

Completed Topics:
${user.completedTopics.join(", ")}

Weak Areas:
${user.weakAreas.join(", ")}

Student Question:
${question}
`;

console.log(prompt);

const claudeCall = async () => {
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
  for (const block of msg.content) {
    if (block.type === "text") {
      console.log(block.text);
    }
  }
};

claudeCall();

user.currentDay = 7;
user.completedTopics.push("Context Engineering");

fs.writeFileSync(
  "./memory/user.json",
  JSON.stringify(
    user,
    null,
    2,
  ),
);
