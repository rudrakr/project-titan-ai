Absolutely. You want **one complete `README.md` file as Markdown source code**, so you can copy everything directly into `day-09-vector-db/README.md`.

````markdown
# 🤖 Project Titan — Day 09: Vector Database with ChromaDB

> Building a production-style RAG pipeline step by step.

Day 09 upgrades the RAG application created in **Day 08** by introducing **ChromaDB as a persistent vector database**.

The goal is to separate the responsibilities of:

- 📄 Document extraction
- ✂️ Text chunking
- 🧠 Embedding generation
- 🗄️ Vector storage
- 🔍 Semantic retrieval
- 📝 Prompt construction
- 🤖 LLM generation

---

# 📚 Table of Contents

- [1. What We Built in Day 08](#1-what-we-built-in-day-08)
- [2. What Changes in Day 09](#2-what-changes-in-day-09)
- [3. RAG Architecture](#3-rag-architecture)
- [4. Why ChromaDB](#4-why-chromadb)
- [5. What Is a Vector Database](#5-what-is-a-vector-database)
- [6. Project Structure](#6-project-structure)
- [7. Complete Flow](#7-complete-flow)
- [8. Step 1 — Extract Text](#8-step-1--extract-text)
- [9. Step 2 — Create Chunks](#9-step-2--create-chunks)
- [10. Step 3 — Create Embeddings](#10-step-3--create-embeddings)
- [11. Step 4 — Start ChromaDB](#11-step-4--start-chromadb)
- [12. Step 5 — Create ChromaDB Collection](#12-step-5--create-chromadb-collection)
- [13. Step 6 — Store Embeddings](#13-step-6--store-embeddings)
- [14. Step 7 — Retrieve Relevant Chunks](#14-step-7--retrieve-relevant-chunks)
- [15. Step 8 — Build the Prompt](#15-step-8--build-the-prompt)
- [16. Step 9 — Ask Claude](#16-step-9--ask-claude)
- [17. Step 10 — Interactive Questions](#17-step-10--interactive-questions)
- [18. Why We Store Both Vectors and Text](#18-why-we-store-both-vectors-and-text)
- [19. Why Chunks Don't Know About File Types](#19-why-chunks-dont-know-about-file-types)
- [20. ChromaDB vs Embedding Model](#20-chromadb-vs-embedding-model)
- [21. Docker and WSL](#21-docker-and-wsl)
- [22. Important ChromaDB Concepts](#22-important-chromadb-concepts)
- [23. Troubleshooting](#23-troubleshooting)
- [24. Running the Project](#24-running-the-project)
- [25. Example](#25-example)
- [26. Day 09 Learning Summary](#26-day-09-learning-summary)
- [27. What's Next](#27-whats-next)

---

# 1. What We Built in Day 08

In Day 08 we built the basic RAG pipeline.

The flow was:

```text
Document
   ↓
Extract Text
   ↓
Create Chunks
   ↓
Create Embeddings
   ↓
Store Embeddings in Memory
   ↓
Question
   ↓
Similarity Search
   ↓
Relevant Chunks
   ↓
Build Prompt
   ↓
Claude
   ↓
Answer
````

The important limitation was:

> The embeddings were kept in application memory.

If the application stopped, the embeddings were gone.

There was also no proper vector database.

---

# 2. What Changes in Day 09

Day 09 introduces:

```text
                    ┌─────────────────┐
                    │     Document    │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Extract Text    │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Create Chunks   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Create Embedding│
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │    ChromaDB     │
                    │ Vector Database │
                    └─────────────────┘
                             ↑
                             │
                         Question
                             │
                             ↓
                    ┌─────────────────┐
                    │ Semantic Search │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Relevant Chunks │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  Build Prompt   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │     Claude      │
                    └─────────────────┘
```

The major addition is:

```text
ChromaDB
```

---

# 3. RAG Architecture

The Day 09 architecture is:

```text
                    INGESTION
                       │
                       ↓
                ┌──────────────┐
                │    Files     │
                │ PDF / TXT /  │
                │ DOCX / etc.  │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Extract Text │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Create       │
                │ Chunks       │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Embedding    │
                │ Model        │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │  ChromaDB    │
                │ Vector Store │
                └──────────────┘


                     QUERY
                       │
                       ↓
                ┌──────────────┐
                │   Question   │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Question     │
                │ Embedding    │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │  ChromaDB    │
                │ Similarity   │
                │   Search     │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Top Chunks   │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Build Prompt │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │    Claude    │
                └──────┬───────┘
                       ↓
                    Answer
```

---

# 4. Why ChromaDB?

Before Day 09:

```text
Application Memory

embeddedChunks = [
   {
      chunk: {...},
      embedding: [...]
   },
   {
      chunk: {...},
      embedding: [...]
   }
]
```

This works for learning.

But imagine:

```text
1,000 PDFs
       ↓
50,000 chunks
       ↓
50,000 embeddings
```

Keeping everything inside the Node.js process is not a good architecture.

A vector database allows us to store and retrieve this information separately.

```text
Node.js Application
        │
        │
        ↓
    ChromaDB
        │
        ├── IDs
        ├── Embeddings
        ├── Documents
        └── Metadata
```

This means the application can query the database whenever it needs relevant information.

---

# 5. What Is a Vector Database?

A vector database stores numerical representations of text.

For example:

```text
"Employees receive £50 travel allowance"
```

is converted by an embedding model into something like:

```text
[
  0.021,
  -0.182,
  0.734,
  0.092,
  ...
]
```

This is called an:

```text
Embedding Vector
```

The vector represents the semantic meaning of the text.

Two pieces of text with similar meanings should have vectors that are close to each other in vector space.

For example:

```text
Question:
"How much do employees get for UK travel?"

                 ↓

          Embedding Model

                 ↓

        [0.12, -0.44, ...]


Document:
"Employees travelling within the UK
receive £50 per day."

                 ↓

          Embedding Model

                 ↓

        [0.11, -0.42, ...]
```

Because the vectors are close, ChromaDB can identify the document as relevant.

---

# 6. Project Structure

The Day 09 project is organized approximately like this:

```text
day-09-vector-db/
│
├── docs/
│   └── company-policy.txt
│
├── src/
│   │
│   ├── index.ts
│   │
│   ├── types.ts
│   │
│   ├── services/
│   │   ├── embed.ts
│   │   ├── retrieve.ts
│   │   ├── chroma.ts
│   │   └── claude.ts
│   │
│   └── utils/
│       ├── chunk.ts
│       ├── extract-text.ts
│       └── prompt.ts
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

The important architectural principle is:

> Each module should have one clear responsibility.

---

# 7. Complete Flow

The complete Day 09 flow is:

```text
company-policy.txt
        │
        ↓
extractText()
        │
        ↓
Plain Text
        │
        ↓
createChunks()
        │
        ↓
Chunk[]
        │
        ↓
createEmbeddings()
        │
        ↓
EmbeddedChunk[]
        │
        ↓
storeEmbeddings()
        │
        ↓
ChromaDB
        │
        │
        │
        ↓
User Question
        │
        ↓
retrieveChunks()
        │
        ↓
Relevant Chunks
        │
        ↓
buildPrompt()
        │
        ↓
askClaude()
        │
        ↓
Final Answer
```

---

# 8. Step 1 — Extract Text

The responsibility of `extract-text.ts` is:

> Convert a file into plain text.

For example:

```text
PDF
TXT
DOCX
```

should eventually become:

```text
Plain Text
```

The chunking system should NOT care whether the original document was:

```text
PDF
TXT
DOCX
```

This is an important architectural decision.

The pipeline becomes:

```text
File
 ↓
File Type Detection
 ↓
Correct Parser
 ↓
Plain Text
 ↓
Chunking
```

For example:

```text
company-policy.pdf
        ↓
PDF Parser
        ↓
Plain Text
        ↓
createChunks()
```

and:

```text
company-policy.txt
        ↓
TXT Reader
        ↓
Plain Text
        ↓
createChunks()
```

Therefore `createChunks()` only needs:

```typescript
text: string
```

---

# 9. Step 2 — Create Chunks

The chunking function receives plain text:

```typescript
createChunks(text, filePath)
```

It should not need to know:

```text
Is this PDF?
Is this DOCX?
Is this TXT?
```

Its responsibility is simply:

```text
Text
 ↓
Chunks
```

Example:

```text
Travel Policy

Employees travelling within the UK receive £50 per day as a travel allowance.

----------------------------------

Annual Leave Policy

Employees receive 25 days of annual leave every year.
```

becomes:

```typescript
[
  {
    id: 0,
    title: "Travel Policy",
    content: "...",
    source: "company-policy.txt"
  },

  {
    id: 1,
    title: "Annual Leave Policy",
    content: "...",
    source: "company-policy.txt"
  }
]
```

---

# 10. Step 3 — Create Embeddings

The chunks are sent to the embedding model.

```text
Chunk
 ↓
Embedding Model
 ↓
Vector
```

Example:

```typescript
{
  chunk: {
    id: 0,
    title: "Travel Policy",
    content: "Employees travelling within the UK receive £50 per day...",
    source: "company-policy.txt"
  },

  embedding: [
    0.021,
    -0.182,
    0.734,
    ...
  ]
}
```

The embedding model is responsible for creating vectors.

ChromaDB is responsible for storing and searching those vectors.

These are two different responsibilities.

---

# 11. Step 4 — Start ChromaDB

ChromaDB is running as a Docker container.

Check:

```bash
docker ps
```

Expected result:

```text
CONTAINER ID   IMAGE             STATUS
xxxxxxx        chromadb/chroma   Up
```

The ChromaDB server is exposed on:

```text
http://localhost:8000
```

---

# 12. Step 5 — Create ChromaDB Collection

The application connects to ChromaDB:

```typescript
const chroma = new ChromaClient({
  path: "http://localhost:8000",
});
```

Then we create or retrieve a collection:

```typescript
export async function getCollection() {
  return await chroma.getOrCreateCollection({
    name: "company-policies",
    embeddingFunction: null,
  });
}
```

The collection is similar conceptually to a container for related vector data.

Here:

```text
company-policies
```

is our collection.

Conceptually:

```text
ChromaDB
   │
   └── company-policies
          │
          ├── Travel Policy
          ├── Annual Leave
          ├── Training
          ├── Remote Working
          └── Medical Insurance
```

---

# 13. Step 6 — Store Embeddings

The function:

```typescript
storeEmbeddings()
```

takes:

```typescript
EmbeddedChunk[]
```

and stores the information in ChromaDB.

The important part is:

```typescript
await collection.upsert({
  ids: embeddedChunks.map((item) =>
    String(item.chunk.id)
  ),

  embeddings: embeddedChunks.map(
    (item) => item.embedding
  ),

  documents: embeddedChunks.map(
    (item) => item.chunk.content
  ),

  metadatas: embeddedChunks.map((item) => ({
    title: item.chunk.title,
    source: item.chunk.source,
  })),
});
```

This stores four important pieces of information.

### ID

```text
0
1
2
3
4
```

### Embedding

```text
[0.12, -0.34, 0.78, ...]
```

### Document

```text
"Employees travelling within the UK receive £50 per day..."
```

### Metadata

```json
{
  "title": "Travel Policy",
  "source": "company-policy.txt"
}
```

---

# 14. Why Store Both Vector AND Text?

This is very important.

We don't only store:

```text
Vector
```

We also store:

```text
Original chunk text
```

Why?

Because the vector is useful for searching, but the LLM needs the actual text.

For example:

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Matching Vector
```

The vector tells us:

> "This chunk is semantically relevant."

But Claude needs:

```text
Employees travelling within the UK
receive £50 per day as a travel allowance.
```

Therefore:

```text
Vector
+
Document
+
Metadata
```

are stored together.

---

# 15. Step 7 — Retrieve Relevant Chunks

The user asks:

```text
How much travel allowance do employees receive?
```

The question is converted into an embedding.

Then ChromaDB performs similarity search.

Example result:

```text
QueryResult {
  distances: [
    [
      0.205,
      0.353,
      0.391
    ]
  ],

  documents: [
    [
      "Travel Policy ... £50 per day...",
      "Annual Leave Policy ...",
      "Training Policy ..."
    ]
  ],

  ids: [
    [
      "0",
      "1",
      "3"
    ]
  ]
}
```

The smallest distance represents the closest match.

Therefore:

```text
0.205 → Travel Policy
```

is more relevant than:

```text
0.353 → Annual Leave
```

or:

```text
0.391 → Training
```

---

# 16. Step 8 — Build the Prompt

After retrieving the relevant chunks, we create a prompt.

Conceptually:

```text
Question:
How much travel allowance do employees receive?

Relevant context:

Travel Policy

Employees travelling within the UK receive £50 per day as a travel allowance.

Annual Leave Policy

Employees receive 25 days of annual leave every year.

Training Policy

Every employee receives a £1000 annual learning budget...
```

This is passed to Claude.

The important concept is:

```text
RAG = Retrieval + Generation
```

The retrieval happens first.

The LLM generation happens second.

---

# 17. Step 9 — Ask Claude

The Claude service receives the generated prompt.

```typescript
const answer = await askClaude(prompt);
```

Claude then generates the final natural-language answer.

Example:

```text
Every employee travelling within the UK receives
£50 per day as a travel allowance.
```

Claude is not directly searching the documents.

The application first retrieves the relevant information and provides it to Claude.

---

# 18. Step 10 — Interactive Questions

We added Node.js `readline` so the user can continuously ask questions.

Example:

```text
❓ Ask a question (type 'exit' to quit):
```

The user can enter:

```text
training
```

Then:

```text
🔍 Retrieving relevant chunks...
```

ChromaDB finds the most relevant chunks.

Then:

```text
📝 Building prompt...
```

Then:

```text
🤖 Asking Claude...
```

And finally:

```text
Every employee receives a £1000 annual learning budget,
which can be used for certifications and technical training.
```

The loop continues until:

```text
exit
```

is entered.

---

# 19. Why Chunks Don't Know About File Types

This is an important architecture decision.

The chunking function should not contain:

```typescript
if (extension === ".pdf") {
   // parse PDF
}

if (extension === ".docx") {
   // parse DOCX
}

if (extension === ".txt") {
   // read TXT
}
```

Instead:

```text
             FILE
              │
              ↓
       File Type Detection
              │
       ┌──────┼───────┐
       ↓      ↓       ↓
      TXT    PDF     DOCX
       │      │       │
       ↓      ↓       ↓
       └──────┼───────┘
              ↓
          Plain Text
              │
              ↓
        createChunks()
```

This gives us a clean separation.

### Extractor responsibility

```text
File → Text
```

### Chunk responsibility

```text
Text → Chunks
```

### Embedding responsibility

```text
Chunks → Vectors
```

### Vector database responsibility

```text
Vectors → Storage + Search
```

### LLM responsibility

```text
Context + Question → Answer
```

---

# 20. ChromaDB vs Embedding Model

ChromaDB does NOT automatically mean that ChromaDB must create our embeddings.

These are separate concepts.

```text
Embedding Model
      │
      │ creates
      ↓
   Embedding
      │
      ↓
   ChromaDB
      │
      │ stores + searches
      ↓
Relevant Chunks
```

In this project we already have an embedding service.

Therefore:

```text
Embedding Service
       ↓
creates vectors
       ↓
ChromaDB
       ↓
stores vectors
```

This is a perfectly valid architecture.

---

# 21. Docker and WSL

ChromaDB is running in Docker.

Docker allows us to run ChromaDB as a separate service.

Conceptually:

```text
Windows
   │
   └── Docker Desktop
          │
          └── ChromaDB Container
                  │
                  └── Port 8000
```

The Node.js application communicates with it through:

```text
http://localhost:8000
```

WSL is involved because Docker Desktop on Windows uses Linux virtualization capabilities for Linux containers.

We verified Docker with:

```bash
docker run hello-world
```

and received:

```text
Hello from Docker!
```

This confirmed that Docker was working correctly.

---

# 22. Important ChromaDB Concepts

## Collection

A collection is a logical group of vector records.

Example:

```text
company-policies
```

---

## ID

Every stored record needs an ID.

Example:

```text
"0"
"1"
"2"
"3"
"4"
```

---

## Embedding

The numerical vector.

Example:

```text
[0.12, -0.42, 0.71, ...]
```

---

## Document

The original text associated with the vector.

Example:

```text
Employees travelling within the UK receive
£50 per day as a travel allowance.
```

---

## Metadata

Additional information about the document.

Example:

```json
{
  "title": "Travel Policy",
  "source": "company-policy.txt"
}
```

---

## Upsert

We use:

```typescript
collection.upsert()
```

instead of simply inserting.

`upsert` means:

```text
If record doesn't exist
    → create it

If record already exists
    → update it
```

This becomes very useful when documents change.

---

# 23. Troubleshooting

## Problem 1 — Docker not recognized

Error:

```text
'docker' is not recognized as an internal or external command
```

Solution:

Install Docker Desktop and make sure Docker is running.

Verify:

```bash
docker --version
```

Then:

```bash
docker run hello-world
```

---

# Problem 2 — WSL not installed

Windows may show:

```text
The Windows Subsystem for Linux is not installed.
```

WSL can be installed using:

```bash
wsl --install
```

Verify:

```bash
wsl --version
```

---

# Problem 3 — ChromaDB container not running

Check:

```bash
docker ps
```

You should see:

```text
chromadb/chroma
```

If the container is not running, start it again.

Example:

```bash
docker start chromadb
```

---

# Problem 4 — Claude model not found

An old model such as:

```text
claude-sonnet-4-20250514
```

may become deprecated.

If Anthropic returns:

```text
404 NotFoundError
model: ...
```

check Anthropic's currently supported model IDs and update:

```typescript
model: "..."
```

in the Claude service.

---

# Problem 5 — DefaultEmbeddingFunction warning

You may see:

```text
Cannot instantiate a collection with the DefaultEmbeddingFunction.
Please install @chroma-core/default-embed,
or provide a different embedding function
```

In this project we explicitly provide:

```typescript
embeddingFunction: null
```

because the application is already generating embeddings separately.

The architecture is:

```text
Our embedding service
        ↓
Embedding vectors
        ↓
ChromaDB
```

Therefore ChromaDB does not need to generate another embedding.

---

# Problem 6 — index.ts not found

If you run:

```bash
npx tsx index.ts
```

but the file is inside `src`, you will get:

```text
Cannot find module ... index.ts
```

Run:

```bash
npx tsx src/index.ts
```

instead.

---

# 24. Running the Project

## Step 1 — Start Docker

Make sure Docker Desktop is running.

---

## Step 2 — Verify ChromaDB

```bash
docker ps
```

You should see the ChromaDB container.

---

## Step 3 — Go to the project

```bash
cd "D:\AI Study\project-titan\day-09-vector-db"
```

---

## Step 4 — Run the application

```bash
npx tsx src/index.ts
```

Expected output:

```text
📄 Extracting text...
✂️ Creating chunks...
Created 5 chunks.

🧠 Creating embeddings...
Created 5 embeddings.

🗑️ Resetting ChromaDB collection...
🗑️ Deleted existing ChromaDB collection

🗄️ Storing embeddings in ChromaDB...
✅ Stored 5 embeddings in ChromaDB

🎉 Day 9 storage complete!

❓ Ask a question (type 'exit' to quit):
```

---

# 25. Example

Ask:

```text
How much travel allowance do employees receive?
```

The system performs:

```text
Question
   ↓
Embedding
   ↓
ChromaDB similarity search
   ↓
Travel Policy chunk
   ↓
Prompt
   ↓
Claude
```

Final answer:

```text
Employees travelling within the UK receive £50 per day
as a travel allowance.
```

---

# 26. Day 09 Learning Summary

By the end of Day 09, the RAG system has evolved from:

```text
RAG
+
In-memory embeddings
```

to:

```text
RAG
+
Vector Database
```

We learned:

### 📄 Document processing

```text
File → Text
```

### ✂️ Chunking

```text
Text → Chunks
```

### 🧠 Embeddings

```text
Chunks → Vectors
```

### 🗄️ Vector database

```text
Vectors → ChromaDB
```

### 🔍 Retrieval

```text
Question → Similarity Search → Relevant Chunks
```

### 📝 Prompt construction

```text
Question + Context → Prompt
```

### 🤖 Generation

```text
Prompt → Claude → Answer
```

---

# 27. What's Next

The next stages can build on this architecture.

Potential improvements include:

```text
Day 09
Vector Database
      ↓
Day 10
MCP
      ↓
Tools / Resources
      ↓
AI Agent
      ↓
Multiple Documents
      ↓
PDF / DOCX ingestion
      ↓
Incremental document updates
      ↓
Production RAG architecture
```

A particularly important future improvement is **incremental ingestion**.

Instead of rebuilding everything whenever a document changes:

```text
1,000 PDFs
   ↓
Change detected in 10 PDFs
   ↓
Process only those 10 PDFs
   ↓
Re-chunk changed documents
   ↓
Re-create embeddings for changed chunks
   ↓
Upsert changed vectors into ChromaDB
```

This is one of the reasons we are keeping:

```text
ID
+
Embedding
+
Document
+
Metadata
```

together.

---

# 🎯 Final Day 09 Architecture

```text
                         ┌─────────────────────┐
                         │      Documents      │
                         │ PDF / TXT / DOCX... │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │   Extract Text      │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │    Create Chunks    │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │ Embedding Service   │
                         └──────────┬──────────┘
                                    │
                                    ↓
                    ┌──────────────────────────────┐
                    │          ChromaDB            │
                    │                              │
                    │  ID                         │
                    │  Embedding                   │
                    │  Document                    │
                    │  Metadata                    │
                    └──────────────┬───────────────┘
                                   │
                                   │
              ┌────────────────────┘
              │
              ↓
       ┌───────────────┐
       │ User Question │
       └───────┬───────┘
               │
               ↓
       ┌───────────────┐
       │ Query         │
       │ Embedding     │
       └───────┬───────┘
               │
               ↓
       ┌───────────────┐
       │ ChromaDB      │
       │ Similarity    │
       │ Search        │
       └───────┬───────┘
               │
               ↓
       ┌───────────────┐
       │ Relevant      │
       │ Chunks        │
       └───────┬───────┘
               │
               ↓
       ┌───────────────┐
       │ Build Prompt  │
       └───────┬───────┘
               │
               ↓
       ┌───────────────┐
       │    Claude     │
       └───────┬───────┘
               │
               ↓
          Final Answer
```

## 🚀 Day 09 Complete

The key architectural lesson from Day 09 is:

> **Keep each responsibility separate.**

```text
Extractor
    ↓
Text

Chunker
    ↓
Chunks

Embedding Service
    ↓
Vectors

ChromaDB
    ↓
Storage + Retrieval

Prompt Builder
    ↓
Prompt

Claude
    ↓
Answer
```

This separation will make the project much easier to extend when we introduce **multiple documents, PDF/DOCX ingestion, incremental updates, MCP, and agent-based workflows**.

```
```
