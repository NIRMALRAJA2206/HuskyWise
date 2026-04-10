export type ParsedDocument = {
  type: "pdf" | "txt" | "md" | "docx";
  pageTexts: string[];
};

export type StoredDocument = {
  id: string;
  fileName: string;
  type: ParsedDocument["type"];
  pageCount: number;
  chunkCount: number;
  uploadedAt: string;
};

export type StoredChunk = {
  id: string;
  documentId: string;
  fileName: string;
  page: number;
  text: string;
  embedding: number[];
};

export type HuskywiseStore = {
  documents: StoredDocument[];
  chunks: StoredChunk[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
