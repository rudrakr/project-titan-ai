import { runAgent } from "./agent.js";

const result = await runAgent(
  "What's the weather like in Paris?"
);

console.log(result);