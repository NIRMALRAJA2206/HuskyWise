import { chunkPageText } from "@/lib/chunking";
import { embedText } from "@/lib/llm";
import { parseUploadedFile } from "@/lib/parsers";
import { upsertDocumentWithChunks } from "@/lib/store";
import type { StoredChunk, StoredDocument } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);

    if (!files.length) {
      return Response.json({ error: "No files received." }, { status: 400 });
    }

    console.log(`[Upload] Processing ${files.length} file(s)`);

    let indexedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        await indexFile(file);
        indexedCount += 1;
      } catch (error) {
        console.error(`[Upload] Indexing failed for ${file.name}:`, error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (indexedCount === 0 && errors.length > 0) {
      return Response.json({ success: false, error: errors.join("; ") }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      indexed: indexedCount,
      partialErrors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("[Upload] Critical failure:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload indexing failed.",
      },
      { status: 500 },
    );
  }
}

async function indexFile(file: File): Promise<void> {
  console.log(`[Upload] Starting indexing for ${file.name}`);
  const parsed = await parseUploadedFile(file);
  const pageInputs = parsed.pageTexts.map((text, index) => ({
    page: index + 1,
    text,
  }));
  const rawChunks = chunkPageText(pageInputs);

  if (!rawChunks.length) {
    throw new Error(`No text could be extracted from ${file.name}.`);
  }

  console.log(`[Upload] Extracted ${rawChunks.length} chunks from ${file.name}. Generating embeddings...`);

  const documentId = toDocumentId(file.name);
  const chunks: StoredChunk[] = [];

  // Parallelize embeddings to speed up the process, but in batches to avoid rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
    const batch = rawChunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await Promise.all(
      batch.map(async (chunk, j) => {
        const index = i + j;
        const embedding = await embedText(chunk.text);
        return {
          id: `${documentId}-${(index + 1).toString()}`,
          documentId,
          fileName: file.name,
          page: chunk.page,
          text: chunk.text,
          embedding,
        };
      })
    );
    chunks.push(...batchEmbeddings);
    console.log(`[Upload] Embedded ${chunks.length}/${rawChunks.length} chunks for ${file.name}`);
  }

  const document: StoredDocument = {
    id: documentId,
    fileName: file.name,
    type: parsed.type,
    pageCount: parsed.pageTexts.length,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
  };

  await upsertDocumentWithChunks(document, chunks);
  console.log(`[Upload] Successfully indexed ${file.name}`);
}

function toDocumentId(fileName: string): string {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || crypto.randomUUID();
}
