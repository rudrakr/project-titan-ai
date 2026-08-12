# 🚀 Project Titan — Day 08: Retrieval-Augmented Generation (RAG)

> **Building a RAG chatbot from scratch using TypeScript, Voyage AI, cosine similarity and Claude**

Day 8 of **Project Titan** focuses on understanding and implementing the complete **Retrieval-Augmented Generation (RAG)** pipeline without hiding the important concepts behind a framework.

The goal was not simply to make a chatbot work.

The goal was to understand **what happens internally when a RAG system receives a question**.

---

# 📚 Table of Contents

- [1. What We Built](#1-what-we-built)
- [2. What is RAG?](#2-what-is-rag)
- [3. Why RAG?](#3-why-rag)
- [4. Complete RAG Architecture](#4-complete-rag-architecture)
- [5. RAG Pipeline](#5-rag-pipeline)
- [6. Step 1 — Document](#6-step-1--document)
- [7. Step 2 — Chunking](#7-step-2--chunking)
- [8. Step 3 — Embeddings](#8-step-3--embeddings)
- [9. Step 4 — Vector Representation](#9-step-4--vector-representation)
- [10. Step 5 — Query Embedding](#10-step-5--query-embedding)
- [11. Step 6 — Cosine Similarity](#11-step-6--cosine-similarity)
- [12. Step 7 — Top-K Retrieval](#12-step-7--top-k-retrieval)
- [13. Step 8 — Prompt Construction](#13-step-8--prompt-construction)
- [14. Step 9 — Claude](#14-step-9--claude)
- [15. Interactive CLI](#15-interactive-cli)
- [16. Complete Data Flow](#16-complete-data-flow)
- [17. Project Structure](#17-project-structure)
- [18. Important Architectural Decisions](#18-important-architectural-decisions)
- [19. What We Learned](#19-what-we-learned)
- [20. Current Limitations](#20-current-limitations)
- [21. Next Steps](#21-next-steps)
- [22. Future Architecture](#22-future-architecture)

---

# 1. What We Built

We built a small RAG system that can answer questions from an internal company document.

For example:

```text
User:
How much travel allowance do employees receive?

RAG:
Employees travelling within the UK receive £50 per day.
```

The important part is that the answer is generated using information retrieved from the supplied document.

The system does not need the company policy to be part of the model's original training data.

---

# 2. What is RAG?

RAG stands for:

**Retrieval-Augmented Generation**

It combines two major capabilities:

```text
RETRIEVAL
    +
GENERATION
```

### Retrieval

Find relevant information from an external knowledge source.

### Generation

Give that information to an LLM so that it can generate a natural-language answer.

Therefore:

```text
Question
   ↓
Retrieve relevant information
   ↓
Give information to LLM
   ↓
Generate answer
```

---

# 3. Why RAG?

A normal LLM does not automatically know an organization's private documents.

For example:

```text
Company Policy
    ↓
Travel allowance = £50/day
```

This information may not exist in the model's training data.

Instead of training/fine-tuning the model every time the company policy changes, RAG allows us to provide the relevant information dynamically.

This makes it possible to build systems using:

- Company policies
- Internal documentation
- Product documentation
- Knowledge bases
- PDFs
- Technical documents
- Manuals
- Private organizational data

---

# 4. Complete RAG Architecture

The architecture we implemented is:

```text
                    ┌─────────────────────┐
                    │   Company Document  │
                    │      (.txt)         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Extract Text     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Chunking       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Embedding      │
                    │     Voyage AI       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Embedded Chunks     │
                    └─────────────────────┘


User Question
      │
      ▼
┌─────────────────────┐
│ Generate Query      │
│ Embedding           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Cosine Similarity   │
│                     │
│ Query Vector        │
│        vs           │
│ Chunk Vectors       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Sort by Similarity  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Top 3 Chunks        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build Prompt        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Claude         │
└──────────┬──────────┘
           │
           ▼
       Final Answer
```

---

# 5. RAG Pipeline

The complete process can be divided into two phases.

## Phase A — Indexing

This happens when documents are added.

```text
Document
   ↓
Extract Text
   ↓
Create Chunks
   ↓
Create Embeddings
   ↓
Store Embeddings
```

## Phase B — Retrieval + Generation

This happens when the user asks a question.

```text
Question
   ↓
Question Embedding
   ↓
Similarity Search
   ↓
Top-K Chunks
   ↓
Prompt
   ↓
Claude
   ↓
Answer
```

This distinction is extremely important.

---

# 6. Step 1 — Document

Our initial document was:

```text
company-policy.txt
```

It contained policies such as:

```text
Travel Policy

Employees travelling within the UK receive £50 per day
as a travel allowance.
```

Other policies included:

- Annual Leave Policy
- Remote Working Policy
- Training Policy
- Medical Insurance

---

# 7. Step 2 — Chunking

A complete document can be very large.

Sending an entire document to an LLM for every question would be inefficient.

Therefore, we divide the document into smaller pieces called:

**Chunks**

For example:

```text
Company Policy
       │
       ├── Travel Policy
       ├── Annual Leave Policy
       ├── Remote Working Policy
       ├── Training Policy
       └── Medical Insurance
```

Our initial implementation used the separator:

```text
----------------------------------
```

Each section became a chunk.

---

# 8. Chunk Data Structure

We created a reusable `Chunk` type.

Conceptually:

```typescript
type Chunk = {
  id: number;
  title: string;
  content: string;
  source: string;
};
```

Example:

```typescript
{
  id: 0,
  title: "Travel Policy...",
  content: "Travel Policy\n\nEmployees travelling...",
  source: "company-policy.txt"
}
```

The important architectural decision was to make `Chunk` a reusable type.

If another property is added later, other types can build on it rather than duplicating the entire structure.

---

# 9. Why Chunking Matters

Suppose we have:

```text
500 chunks
```

and the user asks:

```text
How much travel allowance do employees receive?
```

We don't want to send all 500 chunks to Claude.

Instead:

```text
500 chunks
     ↓
Similarity search
     ↓
Most relevant chunks
     ↓
Top 3
```

This reduces the amount of context sent to the LLM.

It also gives the model more focused information.

---

# 10. Step 3 — Embeddings

A chunk is initially just text.

For example:

```text
Employees travelling within the UK receive £50 per day.
```

An embedding model converts this text into a numerical vector.

Conceptually:

```text
Text
 ↓
Embedding Model
 ↓
[0.012, -0.034, 0.056, ...]
```

The resulting vector represents semantic information about the text.

---

# 11. Voyage AI

We used **Voyage AI** for embeddings.

The TypeScript SDK was:

```text
voyageai
```

The model used during this project was:

```text
voyage-3.5-lite
```

For documents:

```typescript
const response = await voyage.embed({
  input: documents,
  model: "voyage-3.5-lite",
  inputType: "document",
});
```

The important point is:

```text
inputType = document
```

when creating embeddings for document chunks.

---

# 12. Batch Embeddings

Instead of making one API request per chunk, we passed the chunk texts together.

Conceptually:

```typescript
const documents = chunks.map(
  (chunk) => `${chunk.title}\n${chunk.content}`
);
```

Then:

```typescript
const response = await voyage.embed({
  input: documents,
  model: "voyage-3.5-lite",
  inputType: "document",
});
```

This produced multiple embeddings.

One embedding corresponds to each input chunk.

---

# 13. Embedded Chunk

We combined the original chunk with its embedding.

Conceptually:

```typescript
type EmbeddedChunk = {
  chunk: Chunk;
  embedding: number[];
};
```

Therefore:

```text
Chunk
 +
Embedding
 =
EmbeddedChunk
```

Example:

```text
EmbeddedChunk
│
├── chunk
│    ├── id
│    ├── title
│    ├── content
│    └── source
│
└── embedding
     ├── 0.017...
     ├── -0.032...
     ├── 0.051...
     └── ...
```

This is important because the vector alone is not enough.

We need to know:

```text
Which original chunk does this vector belong to?
```

---

# 14. Step 4 — Vector Representation

After embedding:

```text
Travel Policy
      ↓
Vector A

Annual Leave Policy
      ↓
Vector B

Remote Working Policy
      ↓
Vector C

Training Policy
      ↓
Vector D

Medical Insurance
      ↓
Vector E
```

These vectors can later be stored in a vector database.

Our initial implementation kept them in memory.

---

# 15. Step 5 — Query Embedding

When the user asks:

```text
How much travel allowance do employees receive?
```

we cannot directly compare this text with numerical vectors.

We first convert the question into an embedding.

The important difference is:

### Document embedding

```text
inputType: "document"
```

### Query embedding

```text
inputType: "query"
```

The query is embedded so it can be compared against the stored document embeddings.

Conceptually:

```text
User Question
      ↓
Query Embedding
      ↓
Question Vector
```

---

# 16. Query vs Document

This was an important concept learned during Day 8.

For indexing:

```text
Document Chunk
      ↓
Document Embedding
```

For retrieval:

```text
User Question
      ↓
Query Embedding
```

Then:

```text
Query Vector
     ↓
Compare
     ↓
Document Vectors
```

---

# 17. Step 6 — Cosine Similarity

Now we have:

```text
Question Vector
```

and:

```text
Chunk Vector 1
Chunk Vector 2
Chunk Vector 3
Chunk Vector 4
Chunk Vector 5
```

We need to determine which vectors are most similar.

We used:

**Cosine Similarity**

Conceptually:

```text
                 Query Vector
                      ↘
                       ↘
                        ↘
                         Similarity
                        ↗
                       ↗
                      ↗
              Chunk Vector
```

Cosine similarity measures how similar the direction of two vectors is.

---

# 18. Why Cosine Similarity?

The actual vector contains many dimensions.

For example:

```text
[0.01, -0.03, 0.05, ...]
```

Humans cannot meaningfully inspect these numbers.

Cosine similarity gives us a numerical similarity score.

Conceptually:

```text
Query
  ↓
Similarity with Travel
Similarity with Leave
Similarity with Remote
Similarity with Training
Similarity with Medical
```

Example:

```text
Travel Policy       0.91
Training Policy     0.42
Annual Leave        0.37
Remote Working      0.31
Medical Insurance   0.25
```

Higher score means greater semantic similarity.

---

# 19. Step 7 — Top-K Retrieval

After calculating similarity:

```text
All chunks
    ↓
Similarity scores
    ↓
Sort descending
    ↓
Take Top K
```

We used:

```text
Top 3
```

So:

```text
500 chunks
   ↓
500 similarity scores
   ↓
Sort
   ↓
Top 3
```

The top three chunks become the retrieval result.

---

# 20. Why Not Send All Chunks?

There are several reasons.

### 1. Context size

Sending hundreds of chunks can consume a large amount of context.

### 2. Cost

More tokens generally means higher API usage.

### 3. Relevance

Most chunks may have nothing to do with the question.

### 4. Better focus

The LLM receives the information most relevant to the question.

---

# 21. Top-K is Configurable

We used:

```text
Top 3
```

but this is not a universal rule.

A production application could use:

```text
Top 3
Top 5
Top 10
Top 20
```

depending on:

- Document size
- Question complexity
- Context window
- Customer requirements
- Retrieval quality
- Cost

Therefore:

**Top-K is an architectural/configuration decision.**

---

# 22. Step 8 — Prompt Construction

Once we have the relevant chunks:

```text
Question
+
Retrieved Context
```

we construct a prompt.

Conceptually:

```text
Context:
[Travel Policy]
[Training Policy]
[Annual Leave Policy]

Question:
How much travel allowance do employees receive?
```

This prompt is sent to Claude.

---

# 23. Step 9 — Claude

Claude is responsible for the **generation** part of RAG.

It receives:

```text
User Question
+
Retrieved Context
```

and generates:

```text
Natural Language Answer
```

The important distinction is:

```text
Voyage AI
    ↓
Embedding / Retrieval

Claude
    ↓
Generation
```

They perform different jobs.

---

# 24. Complete RAG Flow

The entire system can now be represented as:

```text
             INDEXING
                │
                ▼
        ┌───────────────┐
        │   Document    │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ Extract Text  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │    Chunk      │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │   Embedding   │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ Vector Store  │
        └───────────────┘


              QUERY
                │
                ▼
        ┌───────────────┐
        │ User Question │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ Query Vector  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │   Similarity  │
        │    Search     │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │    Top-K      │
        │    Chunks     │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ Build Prompt  │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │    Claude     │
        └───────┬───────┘
                ▼
             Answer
```

---

# 25. Interactive CLI

We added Node.js `readline` so the chatbot can continuously accept questions.

Conceptually:

```text
┌───────────────────────────────────────┐
│           RAG CHATBOT                 │
│                                       │
│ Ask a question:                       │
│                                       │
│ > How much travel allowance...?       │
│                                       │
│ Answer: £50 per day                   │
│                                       │
│ Ask another question:                │
│ > How many annual leave days...?      │
└───────────────────────────────────────┘
```

The loop continues until:

```text
exit
```

is entered.

---

# 26. Interactive Flow

The application performs the expensive indexing work first:

```text
Application Start
       ↓
Extract document
       ↓
Create chunks
       ↓
Create embeddings
       ↓
Create readline
```

Then every question performs:

```text
Question
   ↓
Query embedding
   ↓
Retrieve chunks
   ↓
Build prompt
   ↓
Claude
   ↓
Answer
```

This is better than recreating document embeddings for every question.

---

# 27. Project Structure

The architecture evolved during Day 8.

The final structure was organized around responsibilities:

```text
day-08-rag/
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
│   │   └── claude.ts
│   │
│   └── utils/
│       ├── chunk.ts
│       ├── extract-text.ts
│       └── prompt.ts
│
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# 28. Separation of Responsibilities

One of the most important architectural lessons from this project was:

> Each component should have one clear responsibility.

For example:

### `extract-text.ts`

Responsible for:

```text
File
 ↓
Text
```

It should not know how chunking works.

---

### `chunk.ts`

Responsible for:

```text
Text
 ↓
Chunks
```

It should not care whether the original source was:

```text
TXT
PDF
DOCX
```

---

### `embed.ts`

Responsible for:

```text
Chunks
 ↓
Embeddings
```

---

### `retrieve.ts`

Responsible for:

```text
Question
+
Embedded Chunks
 ↓
Relevant Chunks
```

---

### `prompt.ts`

Responsible for:

```text
Question
+
Chunks
 ↓
Prompt
```

---

### `claude.ts`

Responsible for:

```text
Prompt
 ↓
Claude
 ↓
Answer
```

---

# 29. Why This Architecture is Better

Suppose tomorrow we add PDF support.

We should not modify the chunking logic to understand PDFs.

Instead:

```text
PDF
 ↓
PDF Parser
 ↓
Text
 ↓
createChunks()
```

For TXT:

```text
TXT
 ↓
Text
 ↓
createChunks()
```

For DOCX:

```text
DOCX
 ↓
DOCX Parser
 ↓
Text
 ↓
createChunks()
```

Therefore the chunker remains independent of file format.

---

# 30. File-Type Detection

The next architectural step is to determine the file type from the extension.

For example:

```text
company-policy.txt
             ↑
             extension
```

Potential future flow:

```text
File
 ↓
Check extension
 ↓
TXT ──────→ Text extraction
PDF ──────→ PDF parser
DOCX ─────→ DOCX parser
```

All paths eventually produce:

```text
string
```

which is passed to:

```typescript
createChunks(text)
```

This keeps chunking independent of document format.

---

# 31. Important Lesson — Chunking is Not One Universal Algorithm

Chunking can be performed in many ways.

Examples include:

```text
Heading based
Paragraph based
Character based
Token based
Sentence based
Semantic chunking
Recursive chunking
```

The correct approach depends on the document and application.

For our initial implementation, we used policy sections separated by:

```text
----------------------------------
```

because the document structure naturally provided meaningful sections.

---

# 32. Important Lesson — Metadata Matters

A chunk should not only contain its vector.

It should retain metadata such as:

```text
id
title
content
source
embedding
```

This allows the application to map:

```text
Vector
 ↓
Original Chunk
 ↓
Original Document
```

This becomes especially important when thousands of documents are involved.

---

# 33. Why Store Chunk + Vector?

Suppose we have:

```text
Document A
   ↓
Chunk 17
   ↓
Vector
```

If the document changes later, we want to know:

```text
Which chunk changed?
Which vector belongs to that chunk?
```

Keeping the relationship between:

```text
Chunk ↔ Embedding
```

makes incremental updates possible.

This becomes particularly useful once a real vector database is introduced.

---

# 34. What Happens with 1,000 PDFs?

The architecture should eventually become:

```text
             docs/
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
   PDF       PDF        TXT
     │         │         │
     ▼         ▼         ▼
  Extract   Extract   Extract
     │         │         │
     └─────────┼─────────┘
               ▼
             Text
               ▼
            Chunks
               ▼
          Embeddings
               ▼
        Vector Database
```

The application should automatically process the files rather than hard-coding:

```typescript
const documentPath = "docs/company-policy.txt";
```

for every document.

---

# 35. What We Have Achieved

By the end of Day 8, we built the core RAG pipeline ourselves.

We implemented:

```text
✅ Document ingestion
✅ Text extraction
✅ Chunking
✅ Chunk metadata
✅ Document embeddings
✅ Query embeddings
✅ Cosine similarity
✅ Similarity ranking
✅ Top-K retrieval
✅ Prompt construction
✅ Claude integration
✅ Interactive CLI
```

---

# 36. What We Learned About RAG

The most important conceptual understanding is:

```text
RAG ≠ Claude
```

RAG is an architecture.

It consists of:

```text
Knowledge Retrieval
        +
LLM Generation
```

Claude is only the generation component in our implementation.

The retrieval system can exist independently.

---

# 37. Can RAG Work Without Claude?

Yes.

The retrieval portion can work independently:

```text
Question
   ↓
Query Embedding
   ↓
Similarity Search
   ↓
Top Matching Chunks
```

At that point, the application could simply return the retrieved chunks.

Claude is added when we want a natural-language answer generated from those chunks.

Therefore:

```text
RAG Retrieval
       +
LLM
```

is the complete question-answering experience.

---

# 38. RAG Without an LLM

For example:

```text
Question:
How much travel allowance do employees receive?
```

Retrieval could return:

```text
Travel Policy

Employees travelling within the UK receive
£50 per day as a travel allowance.
```

This is already useful.

The LLM simply transforms the retrieved information into a more natural response:

```text
Employees travelling within the UK receive
£50 per day.
```

---

# 39. Interview Explanation

A concise interview explanation:

> "I implemented a RAG pipeline where documents are first extracted and split into meaningful chunks. Each chunk is converted into an embedding using Voyage AI and associated with its original metadata. When a user asks a question, the question is embedded using the query embedding mode. I then calculate cosine similarity between the query vector and stored chunk vectors, rank the results, and retrieve the top-K chunks. Those chunks are added to a prompt along with the user's question and sent to Claude for generation."

---

# 40. One-Minute RAG Explanation

If asked:

**"Explain RAG."**

A simple answer:

```text
RAG stands for Retrieval-Augmented Generation.

First, documents are split into chunks and converted
into vector embeddings.

Those embeddings are stored in a vector store.

When the user asks a question, the question is also
converted into an embedding.

We compare the question vector against document vectors
using a similarity algorithm such as cosine similarity.

We retrieve the most relevant chunks and provide them
to an LLM as context.

The LLM then generates the final answer using that
retrieved information.
```

---

# 41. Current Limitations

This Day 8 implementation is intentionally a learning implementation.

Currently:

```text
❌ No real vector database
❌ Initial source is TXT
❌ No automatic multi-document ingestion
❌ No document update detection
❌ No chunk persistence
❌ No production authentication
❌ No production observability
```

These are deliberate next steps.

---

# 42. Next Mission

The next stage of Project Titan is:

## 📄 PDF Support

Instead of only:

```text
TXT
```

we will support:

```text
PDF
```

The architecture will become:

```text
PDF
 ↓
PDF Parser
 ↓
Text
 ↓
Chunker
```

The chunker itself remains independent of PDF.

---

# 43. Next Mission — ChromaDB

The current implementation keeps embeddings in memory.

That means:

```text
Application stops
       ↓
Embeddings disappear
```

A real vector database solves this.

The next stage introduces:

```text
ChromaDB
```

The architecture becomes:

```text
Documents
    ↓
Chunks
    ↓
Embeddings
    ↓
ChromaDB
```

Then retrieval becomes:

```text
Question
    ↓
Query Embedding
    ↓
ChromaDB
    ↓
Top-K Chunks
```

---

# 44. Future RAG Architecture

The target architecture will eventually look like:

```text
                    DOCUMENT INGESTION
                           │
                           ▼
                    ┌──────────────┐
                    │ File Scanner │
                    └──────┬───────┘
                           ▼
                  ┌─────────────────┐
                  │ Format Detector │
                  └───────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
            TXT          PDF          DOCX
             │            │            │
             └────────────┼────────────┘
                          ▼
                    Extract Text
                          │
                          ▼
                       Chunking
                          │
                          ▼
                      Embedding
                          │
                          ▼
                    ┌───────────┐
                    │ ChromaDB  │
                    └─────┬─────┘
                          │
                          │
                    USER QUESTION
                          │
                          ▼
                    Query Embedding
                          │
                          ▼
                    ChromaDB Search
                          │
                          ▼
                       Top-K
                          │
                          ▼
                    Prompt Builder
                          │
                          ▼
                        Claude
                          │
                          ▼
                       Answer
```

---

# 45. Day 8 Summary

The key mental model from Day 8 is:

```text
                 RAG
                  │
       ┌──────────┴──────────┐
       │                     │
   RETRIEVAL             GENERATION
       │                     │
       ▼                     ▼
  Embeddings              Claude
       │
       ▼
Similarity Search
       │
       ▼
   Top-K Chunks
```

And the complete journey is:

```text
DOCUMENT
   ↓
EXTRACT
   ↓
CHUNK
   ↓
EMBED
   ↓
STORE
   ↓

QUESTION
   ↓
EMBED
   ↓
SEARCH
   ↓
TOP-K
   ↓
PROMPT
   ↓
CLAUDE
   ↓
ANSWER
```

---

# 🎯 Project Titan — Day 08 Complete

This project started with a simple text document.

By the end of Day 8, it had become an actual working RAG chatbot.

The most important achievement was not the final chatbot.

It was understanding the architecture behind it:

```text
Documents
    ↓
Chunks
    ↓
Vectors
    ↓
Similarity
    ↓
Relevant Context
    ↓
LLM
    ↓
Answer
```

**Next:** PDF ingestion → ChromaDB → cleaner production-style architecture → Vector DB concepts → MCP.