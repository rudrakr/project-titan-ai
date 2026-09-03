import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "titan-study-assistant",
    version: "1.0.0",
  });

  server.registerTool(
    "create_study_plan",
    {
      title: "Create a Study Plan",
      description: "Create a focused study plan for an AI topic.",
      inputSchema: z.object({
        topic: z
          .enum(["mcp", "rag", "agents"])
          .describe("The AI topic to study"),
        minutes: z
          .number()
          .int()
          .min(15)
          .max(180)
          .describe("Available study time, from 15 to 180 minutes"),
        level: z
          .enum(["beginner", "intermediate"])
          .describe("Current learning level"),
      }),
    },
    async ({ topic, minutes, level }) => {
      const topicFocus = {
        mcp: "Model Context Protocol servers, clients, tools, and transports",
        rag: "retrieval, vector databases, and grounded answers",
        agents: "planning, tool use, and autonomous task execution",
      };

      const firstBlock = Math.round(minutes * 0.4);
      const secondBlock = Math.round(minutes * 0.4);
      const finalBlock = minutes - firstBlock - secondBlock;

      const plan = [
        `Topic: ${topic.toUpperCase()}`,
        `Level: ${level}`,
        `Total time: ${minutes} minutes`,
        "",
        `1. Learn (${firstBlock} min): Study ${topicFocus[topic]}.`,
        `2. Practice (${secondBlock} min): Build or modify a small example.`,
        `3. Reflect (${finalBlock} min): Write three notes and one question.`,
      ].join("\n");

      return {
        content: [{ type: "text", text: plan }],
      };
    },
  );
  server.registerResource(
    "mcp-study-guide",
    "titan://study-guide/mcp",
    {
      title: "MCP Study Guide",
      description: "A concise Project Titan guide to MCP fundamentals.",
      mimeType: "text/plain",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: [
            "MCP Study Guide",
            "",
            "MCP is a standard way for AI applications to communicate with tools and data.",
            "A tool performs an action when called.",
            "A resource provides read-only context that a client can read by URI.",
            "A prompt provides a reusable prompt template.",
            "For local MCP servers, stdio carries the protocol between the client and server.",
          ].join("\n"),
        },
      ],
    }),
  );

  //prompt
  server.registerPrompt(
    "study-coach",
    {
      title: "Study Coach",
      description: "Create a focused learning conversation for an AI topic.",
      argsSchema: z.object({
        topic: z.enum(["mcp", "rag", "agents"]),
        level: z.enum(["beginner", "intermediate"]),
      }),
    },
    ({ topic, level }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `Act as a supportive ${level}-level study coach.`,
              `Teach me ${topic.toUpperCase()} using plain language.`,
              "Give one short explanation, one concrete example, and one quiz question.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
  return server;
}
