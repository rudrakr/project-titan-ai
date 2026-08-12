export interface Chunk {
    id: number;
    title: string;
    content: string;
    source: string;
}

export interface EmbeddedChunk {
    chunk: Chunk;
    embedding: number[];
}

export interface SearchResult {
    chunk: Chunk;
    score: number;
}