type ChunkInput = {
  page: number;
  text: string;
};

type ChunkOutput = {
  page: number;
  text: string;
};

const MAX_CHARS = 1100;
const OVERLAP_CHARS = 180;

export function chunkPageText(pages: ChunkInput[]): ChunkOutput[] {
  const chunks: ChunkOutput[] = [];

  for (const page of pages) {
    const normalized = normalizeWhitespace(page.text);
    if (!normalized) continue;

    const slices = splitWithOverlap(normalized, MAX_CHARS, OVERLAP_CHARS);
    for (const slice of slices) {
      chunks.push({
        page: page.page,
        text: slice,
      });
    }
  }

  return chunks;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function splitWithOverlap(input: string, chunkSize: number, overlap: number): string[] {
  const output: string[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const end = Math.min(input.length, cursor + chunkSize);
    let segment = input.slice(cursor, end);

    if (end < input.length) {
      const lastPeriod = segment.lastIndexOf(". ");
      const lastNewline = segment.lastIndexOf("\n");
      const boundary = Math.max(lastPeriod, lastNewline);
      if (boundary > 300) {
        segment = segment.slice(0, boundary + 1);
      }
    }

    const trimmed = segment.trim();
    if (trimmed) output.push(trimmed);

    const moveBy = Math.max(1, segment.length - overlap);
    cursor += moveBy;
  }

  return output;
}
