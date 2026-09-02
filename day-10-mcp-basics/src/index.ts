import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

function createServer(): McpServer {
  const server = new McpServer({
    name: "titan-basics",
    version: "1.0.0",
  });

  server.registerTool(
    "say_hello",
    {
      description: "Say hello to a person by name.",
      inputSchema: z.object({
        name: z.string().describe("The person's name"),
      }),
    },
    async ({ name }) => ({
      content: [
        {
          type: "text",
          text: `Hello, ${name}! Your first Project Titan MCP tool is working.`,
        },
      ],
    }),
  );

  server.registerTool(
    "get_day_focus",
    {
      description: "Get the learning focus for a Project Titan study day. (Enter between number 1 to 10)",
      inputSchema: z.object({
        day: z
          .number()
          .int()
          .min(1)
          .max(10)
          .describe("Study day number, from 1 to 10"),
      }),
    },
    async ({ day }) => {
      const focusByDay: Record<number, string> = {
        1: "JavaScript and Node.js foundations",
        2: "TypeScript foundations",
        3: "APIs and asynchronous programming",
        4: "LLM fundamentals",
        5: "Prompt engineering",
        6: "Embeddings and vector databases",
        7: "Retrieval-Augmented Generation (RAG)",
        8: "Building a RAG pipeline",
        9: "RAG evaluation and improvements",
        10: "Model Context Protocol (MCP)",
      };

      return {
        content: [
          {
            type: "text",
            text: `Day ${day}: ${focusByDay[day]}`,
          },
        ],
      };
    },
  );

  return server;
}

void serveStdio(createServer);
console.error("Titan MCP server is running on stdio");
