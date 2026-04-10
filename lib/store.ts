import { promises as fs } from "node:fs";
import path from "node:path";
import type { HuskywiseStore, StoredChunk, StoredDocument } from "@/lib/types";

const STORE_DIR = path.join(process.cwd(), ".huskywise");
const STORE_FILE = path.join(STORE_DIR, "index.json");

const EMPTY_STORE: HuskywiseStore = {
  documents: [],
  chunks: [],
};

export async function loadStore(): Promise<HuskywiseStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as HuskywiseStore;
  } catch {
    return EMPTY_STORE;
  }
}

export async function saveStore(store: HuskywiseStore): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store), "utf8");
}

export async function upsertDocumentWithChunks(
  document: StoredDocument,
  chunks: StoredChunk[],
): Promise<void> {
  const store = await loadStore();
  const withoutDocument = store.documents.filter((item) => item.id !== document.id);
  const withoutChunks = store.chunks.filter((item) => item.documentId !== document.id);

  await saveStore({
    documents: [document, ...withoutDocument],
    chunks: [...withoutChunks, ...chunks],
  });
}
