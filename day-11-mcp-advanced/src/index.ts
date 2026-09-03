import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.ts";

void serveStdio(createServer);
console.error("Titan Study Assistant MCP server is running on stdio");