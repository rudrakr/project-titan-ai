import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const prompt = process.argv[2] ?? "process.argv[2] without value wont work";


const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1000,
    messages: [
        {
            role: "user",
            //   content: "tell me a joke!!"
            content: prompt
        }
    ]
});

for (const block of message.content) {
    if (block.type === "text") {
        console.log(block.text);
    }
}