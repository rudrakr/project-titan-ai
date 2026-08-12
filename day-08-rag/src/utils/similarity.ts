import cosineSimilarity from "compute-cosine-similarity";

export function similarity(
    vectorA: number[],
    vectorB: number[]
): number {

    return cosineSimilarity(vectorA, vectorB) ?? 0;
}