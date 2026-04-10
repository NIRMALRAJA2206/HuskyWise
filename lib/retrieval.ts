import type { StoredChunk } from "@/lib/types";

export function rankChunksBySimilarity(
  chunks: StoredChunk[],
  queryEmbedding: number[],
  limit = 8,
): StoredChunk[] {
  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);

  return ranked;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return Number.NEGATIVE_INFINITY;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return Number.NEGATIVE_INFINITY;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
