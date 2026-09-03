import { createMcpFastifyApp } from "@modelcontextprotocol/fastify";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createServer } from "./server.ts";

const app = createMcpFastifyApp();

const mcpHandler = createMcpHandler(createServer);
const nodeHandler = toNodeHandler(mcpHandler);

app.all("/mcp", async (request, reply) => {
  await nodeHandler(request.raw, reply.raw, request.body);
});

await app.listen({
  host: "127.0.0.1",
  port: 3000,
});

console.log("Titan MCP HTTP server is running at http://127.0.0.1:3000/mcp");