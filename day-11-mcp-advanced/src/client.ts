import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
  name: "titan-study-client",
  version: "1.0.0",
});

const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/index.ts"],
});

await client.connect(transport);

const tools = await client.listTools();

console.log("Tools discovered:");
for (const tool of tools.tools) {
  console.log(`- ${tool.name}: ${tool.description}`);
}
const { resources } = await client.listResources();

console.log("\nResources discovered:");
for (const resource of resources) {
  console.log(`- ${resource.name}: ${resource.uri}`);
}

const guide = await client.readResource({
  uri: "titan://study-guide/mcp",
});

console.log("\nMCP study guide:");
for (const content of guide.contents) {
  if ("text" in content) {
    console.log(content.text);
  }
}

//calling prompt
const { prompts } = await client.listPrompts();

console.log("\nPrompts discovered:");
for (const prompt of prompts) {
  console.log(`- ${prompt.name}: ${prompt.description}`);
}

const studyCoachPrompt = await client.getPrompt({
  name: "study-coach",
  arguments: {
    topic: "mcp",
    level: "beginner",
  },
});

console.log("\nStudy Coach prompt message:");
console.log(studyCoachPrompt.messages);
const result = await client.callTool({
  name: "create_study_plan",
  arguments: {
    topic: "mcp",
    minutes: 60,
    level: "beginner",
  },
});

console.log("\nStudy plan result:");
console.log(result.content);

await client.close();
