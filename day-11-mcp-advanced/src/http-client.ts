import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const client = new Client({
  name: "titan-http-client",
  version: "1.0.0",
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://127.0.0.1:3000/mcp"),
);

await client.connect(transport);

const { tools } = await client.listTools();

console.log("Tools discovered over HTTP:");
for (const tool of tools) {
  console.log(`- ${tool.name}: ${tool.description}`);
}

const { resources } = await client.listResources();

console.log("\nResources discovered over HTTP:");
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

const { prompts } = await client.listPrompts();

console.log("\nPrompts discovered over HTTP:");
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