import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { getWeather } from "./tools.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY2,
});

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get the current weather for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The name of the city",
        },
      },
      required: ["city"],
    },
  },
];
export async function runAgent(userMessage: string) {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    tools,
    messages,
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");

  if (toolUse) {
    const toolResult = await toolHandlers(toolUse);

    messages.push({
      role: "assistant",
      content: response.content,
    });
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        },
      ],
    });

    // 7. Ask Claude again
    const finalResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      tools,
      messages,
    });

    return finalResponse;
  }

  return response;
}

const toolHandlers = async (toolUse: Anthropic.ToolUseBlock) => {
  if (toolUse.name === "get_weather") {
    const input = toolUse.input as { city: string };

    const result = await getWeather(input.city);

    return result;
  }
};
