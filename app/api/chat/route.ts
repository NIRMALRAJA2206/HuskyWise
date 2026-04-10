import { z } from "zod";
import { completeGroundedAnswer, embedText } from "@/lib/llm";
import { rankChunksBySimilarity } from "@/lib/retrieval";
import { loadStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const store = await loadStore();
    if (!store.chunks.length) {
      return Response.json(
        { error: "No indexed documents found. Upload research files first." },
        { status: 400 },
      );
    }

    const question = [...parsed.data.messages].reverse().find((item) => item.role === "user")?.content;
    if (!question) {
      return Response.json({ error: "No question found in messages." }, { status: 400 });
    }

    const queryEmbedding = await embedText(question);
    const rankedChunks = rankChunksBySimilarity(store.chunks, queryEmbedding, 8);

    const contextBlock = rankedChunks
      .map(
        (chunk, index) =>
          `[${(index + 1).toString()}] ${chunk.fileName} (page ${chunk.page.toString()})\n${chunk.text}`,
      )
      .join("\n\n");

    const recentHistory = parsed.data.messages.slice(-6);
    const prompt: ChatMessage[] = [
      {
        role: "user",
        content: `You are Huskywise, a research assistant for academic document Q&A.

Rules:
- Use only the provided context excerpts.
- If context is insufficient, say exactly: "I cannot answer this from the uploaded material."
- Do not invent facts or citations.
- For each key claim, include citation brackets referencing context IDs like [1], [2].
- Keep the answer concise, factual, and study-friendly.

Context excerpts:
${contextBlock}

Conversation:
${recentHistory.map((item) => `${item.role.toUpperCase()}: ${item.content}`).join("\n")}

Now answer the latest USER question only.`,
      },
    ];

    const answer = await completeGroundedAnswer(prompt);
    const citations = dedupeCitations(rankedChunks).slice(0, 8);
    return Response.json({ answer, citations });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Chat request failed.",
      },
      { status: 500 },
    );
  }
}

function dedupeCitations(
  chunks: Array<{ id: string; documentId: string; fileName: string; page: number }>,
) {
  const seen = new Set<string>();
  const citations: Array<{ chunkId: string; documentId: string; fileName: string; page: number }> = [];

  for (const chunk of chunks) {
    const key = `${chunk.documentId}-${chunk.page.toString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      fileName: chunk.fileName,
      page: chunk.page,
    });
  }

  return citations;
}
