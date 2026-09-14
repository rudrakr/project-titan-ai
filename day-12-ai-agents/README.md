# 🚀 Project Titan --- Day 12: AI Agents

> Build a small Claude-powered agent from scratch to understand tool
> calling, tool execution, tool results, and the agentic loop.

## 🧭 What We Built

The user asks:

``` text
What's the weather like in Paris?
```

Claude decides it needs external information and returns a `tool_use`
request.

Our application then:

1.  Detects `tool_use`.
2.  Executes the real TypeScript function.
3.  Captures the tool result.
4.  Preserves Claude's original assistant message.
5.  Sends a matching `tool_result` using the same `tool_use_id`.
6.  Calls Claude again.
7.  Claude produces the final answer.

## 🏗️ Architecture

``` text
┌──────────────┐
│     USER     │
│ Weather?     │
└──────┬───────┘
       ↓
┌────────────────────┐
│     runAgent()     │
│    Agent Harness   │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│       CLAUDE       │
│  Reason / Decide   │
└─────────┬──────────┘
          │ tool_use
          ↓
┌────────────────────┐
│   toolHandlers()   │
│    Dispatch tool   │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│     getWeather()   │
│      tools.ts      │
└─────────┬──────────┘
          │ tool result
          ↓
┌────────────────────┐
│   messages[]       │
│ assistant tool_use │
│ + user tool_result │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│       CLAUDE       │
│  Final reasoning   │
└─────────┬──────────┘
          ↓
┌──────────────┐
│ FINAL ANSWER │
└──────────────┘
```

## 📁 Project Structure

``` text
day-12-ai-agents/
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── agent.ts
    └── tools.ts
```

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `index.ts`                          Starts the application and supplies
                                      the user request

  `agent.ts`                          Claude client, tool schema,
                                      orchestration and tool handling

  `tools.ts`                          Actual executable tool
                                      implementation

  `.env`                              Secret configuration

  `.gitignore`                        Keeps secrets/dependencies out of
                                      Git

  `package.json`                      Dependencies and npm configuration

  `tsconfig.json`                     TypeScript configuration
  -----------------------------------------------------------------------

## 🧒 ELI5

Imagine Claude is a very clever person.

``` text
Claude = Brain 🧠
Tool = Hands 🖐️
Agent Harness = Coordinator 🧑‍💻
```

A child asks:

> What's the weather in Paris?

Claude thinks:

> I need my weather helper.

Claude does **not** directly run our TypeScript function.

It asks the application:

> Please call `get_weather` for Paris.

The harness runs:

``` ts
getWeather("Paris")
```

The tool returns:

``` text
Paris
18°C
Partly cloudy
```

The harness gives that result back to Claude, and Claude answers the
child.

## 🧠 Engineer-Level Mental Model

``` text
LLM / Claude
    ↓
Reason + decide
    ↓
Tool request
    ↓
Agent harness
    ↓
Tool execution
    ↓
Tool result
    ↓
Claude again
    ↓
Final answer
```

### Key rule

> **Claude chooses the tool; the application executes the tool.**

## 🔧 The Actual Tool

`tools.ts` contains the executable implementation:

``` ts
export async function getWeather(city: string) {
  return {
    city,
    temperature: 18,
    condition: "Partly cloudy",
  };
}
```

This is currently a mock tool. It does not call a real weather API.

### Tool definition vs implementation

``` text
Tool definition
    ↓
Tells Claude what capability exists

Tool implementation
    ↓
Tells our application what actually happens
```

## 🧩 Tool Definition

In `agent.ts` we expose the capability:

``` ts
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
```

Think of it as a menu:

``` text
┌───────────────────────────────┐
│ AVAILABLE TOOL                │
├───────────────────────────────┤
│ Name: get_weather             │
│ Description: current weather  │
│ Input: city → string          │
│ Required: city                │
└───────────────────────────────┘
```

The schema does not execute anything.

## 💬 `runAgent()`

`index.ts` starts the process:

``` ts
const result = await runAgent(
  "What's the weather like in Paris?"
);
```

Then `runAgent()` creates initial state:

``` ts
const messages: Anthropic.MessageParam[] = [
  {
    role: "user",
    content: userMessage,
  },
];
```

Initially:

``` text
messages[]
└── USER
    "What's the weather like in Paris?"
```

## 🤖 First Claude Call

We call the Messages API:

``` ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  tools,
  messages,
});
```

Claude sees:

``` text
USER:
What's the weather like in Paris?

AVAILABLE TOOL:
get_weather(city)
```

Claude decides it needs the tool.

The response contains:

``` text
type: "tool_use"
```

and:

``` text
stop_reason: "tool_use"
```

### ⚠️ Important

`stop_reason: "tool_use"` does **not** mean Claude is stuck or failed.

It means:

> Claude has requested an external action from the application.

## 🆔 `tool_use_id`

Claude's tool request has an ID:

``` text
tool_use_id = ABC123
```

Conceptually:

``` text
assistant
└── tool_use
    ├── name: get_weather
    ├── input: { city: "Paris" }
    └── id: ABC123
```

The result must use the same ID:

``` text
tool request ABC123
        ↓
tool result ABC123
```

This is the correlation between request and result.

## 🧑‍💻 Custom Agent Harness

We wrote our own lightweight harness:

``` ts
const toolHandlers = async (
  toolUse: Anthropic.ToolUseBlock
) => {
  if (toolUse.name === "get_weather") {
    const input = toolUse.input as { city: string };

    const result = await getWeather(input.city);

    return result;
  }
};
```

Claude's symbolic request:

``` text
get_weather
city = Paris
```

is dispatched to:

``` ts
getWeather("Paris")
```

So:

``` text
Claude
  ↓
"Call get_weather"
  ↓
toolHandlers()
  ↓
getWeather("Paris")
  ↓
actual result
```

## 🔄 Preserve Claude's Tool Request

We add Claude's original response to the conversation:

``` ts
messages.push({
  role: "assistant",
  content: response.content,
});
```

Now the conversation remembers:

``` text
USER
What's the weather in Paris?

ASSISTANT
tool_use:
  get_weather
  tool_use_id = ABC123
```

## 📦 Send the Tool Result

Then:

``` ts
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
```

The message history now represents:

``` text
USER
What's the weather in Paris?

ASSISTANT
tool_use
get_weather
ID = ABC123

USER
tool_result
ID = ABC123
18°C, partly cloudy
```

The critical relationship is:

``` text
tool_use.id
     │
     ▼
tool_result.tool_use_id
```

## 🔁 Second Claude Call

Now Claude receives the updated conversation:

``` ts
const finalResponse = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  tools,
  messages,
});
```

Claude now knows:

``` text
User asked:
What's the weather in Paris?

Tool requested:
get_weather("Paris")

Tool returned:
18°C, partly cloudy
```

It can produce:

``` text
The weather in Paris is currently partly cloudy
with a temperature of 18°C (64°F).
```

The final response has:

``` text
stop_reason = end_turn
```

## 📊 Agent State Progress

``` text
Tool definition          ██████████ 100%
Tool implementation      ██████████ 100%
Tool dispatch             ██████████ 100%
tool_use handling         ██████████ 100%
tool_result handling      ██████████ 100%
tool_use_id correlation   ██████████ 100%
Second Claude call        ██████████ 100%

Multi-step loop           ░░░░░░░░░░   0%
Multiple tools            ░░░░░░░░░░   0%
Real weather API          ░░░░░░░░░░   0%
```

## 🧠 Tool Calling vs Agent

### Simple tool calling

``` text
Claude → Tool → Result
```

### Current implementation

``` text
Claude
  ↓
Tool
  ↓
Result
  ↓
Claude
  ↓
Answer
```

### Full multi-step agent

``` text
Claude
  ↓
Tool A
  ↓
Claude
  ↓
Tool B
  ↓
Claude
  ↓
Tool C
  ↓
Claude
  ↓
Final answer
```

The next milestone is the reusable multi-step loop.

## 🧠 Agent vs Workflow

### Workflow

Developer defines the path:

``` text
Step 1
  ↓
Step 2
  ↓
Step 3
  ↓
Step 4
```

### Agent

Claude can decide what action should happen next:

``` text
Goal
 ↓
Claude decides
 ↓
Tool needed?
 ├── YES → execute → Claude again
 └── NO  → answer
```

## 🧠 LLM vs Agent vs Harness vs Tool vs MCP vs RAG

  -----------------------------------------------------------------------
  Component               Mental model            Main responsibility
  ----------------------- ----------------------- -----------------------
  Claude / LLM            🧠 Brain                Reasoning and decisions

  Agent                   🎯 Goal-driven worker   Goal + reasoning +
                                                  actions + state

  Harness                 🧑‍💻 Coordinator          Orchestrates execution
                                                  and loop

  Tool                    🖐️ Hands                Performs an action

  MCP                     🔌 Standard connection  Standardizes how
                                                  capabilities/context
                                                  can be exposed

  RAG                     📚 Library              Retrieves relevant
                                                  knowledge
  -----------------------------------------------------------------------

### Memory shortcut

``` text
RAG → retrieve knowledge
MCP → standardize connection/exposure
Agent → decide what to do
Tool → perform the action
```

MCP is **not required** for this custom agent. We deliberately built the
mechanics without MCP so the agent loop is visible.

## ⭐ CCDV-F --- EXAM MUST KNOW

1.  Claude may return a `tool_use` block when it determines an available
    tool is needed.
2.  The application executes the actual tool.
3.  The application returns the output as a `tool_result`.
4.  `tool_result` uses the matching `tool_use_id`.
5.  Claude's original assistant `tool_use` content must remain in the
    conversation history.
6.  Claude can continue after receiving the tool result.
7.  `end_turn` indicates Claude has completed its turn.
8.  Tool definitions describe capabilities; they do not execute them.
9.  The harness coordinates tool execution and conversation state.
10. A multi-step agent repeatedly follows the tool-use/result cycle
    until an appropriate stopping condition.

## 🎯 Interview Answer

> I built a custom Claude agent harness using the Anthropic Messages
> API. The user sends a goal to Claude, and Claude can decide that it
> needs an external tool. Claude returns a `tool_use` block containing
> the tool name, input and a `tool_use_id`. My application harness
> detects that request and dispatches it to the corresponding TypeScript
> function. I preserve Claude's assistant message and send the tool
> output back as a `tool_result` using the same `tool_use_id`. I then
> call Claude again with the updated conversation so it can reason over
> the tool result and produce the final answer. The current
> implementation demonstrates one tool iteration; the next step is to
> generalize this into a multi-step agent loop.

## ⚠️ Common Mistakes

### Mistake 1 --- Claude executes the function

Incorrect:

``` text
Claude → getWeather()
```

Correct:

``` text
Claude
  ↓
requests get_weather
  ↓
Application executes getWeather()
```

### Mistake 2 --- `tool_use` means failure

Incorrect:

``` text
tool_use = error
```

Correct:

``` text
tool_use = Claude requesting application action
```

### Mistake 3 --- Forgetting `tool_use_id`

Use the same correlation ID:

``` text
tool_use       ABC123
                  ↓
tool_result     ABC123
```

### Mistake 4 --- Stopping after the tool

Incomplete:

``` text
Claude → Tool → Result
```

Complete:

``` text
Claude → Tool → Result → Claude → Answer
```

### Mistake 5 --- Printing instead of returning

This only prints:

``` ts
console.log(result);
```

This makes the value available to the caller:

``` ts
return result;
```

Then:

``` ts
const toolResult = await toolHandlers(toolUse);
```

captures it.

## 🧪 Verification

TypeScript check:

``` bash
npx tsc --noEmit
```

Run:

``` bash
npx tsx src/index.ts
```

Expected final response structure:

``` text
content:
[
  {
    type: "text",
    text: "The weather in Paris is currently partly cloudy..."
  }
]

stop_reason:
"end_turn"
```

## 🔐 Security

Never commit:

``` text
.env
```

Recommended `.gitignore`:

``` gitignore
.env
node_modules/
```

Never hard-code an API key into source code.

## 🏁 Day 12 Milestone

We successfully built the foundation of an agent **without an agent
framework**.

``` text
                    AGENT
                      │
          ┌───────────┴───────────┐
          │                       │
       REASON                  ACTION
          │                       │
       Claude                    Tool
          │                       │
          └──────────┬────────────┘
                     │
                  Harness
                     │
                 State/Loop
```

The key lesson is:

> **Don't just memorize "Agent = LLM + tools". Understand the loop that
> makes it work.**

## 🚀 Next Mission

Current:

``` text
Claude
  ↓
Tool
  ↓
Claude
  ↓
Answer
```

Next:

``` text
while task is not complete:

    Ask Claude

    if Claude requests a tool:
        execute tool
        send result to Claude

    else:
        return final answer
```

Then we can add:

-   Multiple tools
-   Multiple sequential tool calls
-   Stopping conditions
-   Maximum iterations
-   Error handling
-   User intervention
-   Agent state
-   Real external tools
-   Higher-level Claude Agent SDK abstractions

## 📚 Project Titan Learning Rule

``` text
1. Understand the story
        ↓
2. Understand the architecture
        ↓
3. Implement manually
        ↓
4. Test it
        ↓
5. Explain it without notes
        ↓
6. Learn the framework abstraction
        ↓
7. Apply it to a portfolio project
```
