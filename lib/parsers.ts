import * as mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ParsedDocument } from "@/lib/types";
import path from "path";
import { pathToFileURL } from "url";

export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const extension = getExtension(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  console.log(`[Parser] Parsing ${file.name} (type: ${extension}, size: ${bytes.length} bytes)`);

  if (extension === "pdf") {
    // Set worker source for Node.js environment
    const workerPath = path.resolve("node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);

    const parser = new PDFParse({ data: bytes });
    try {
      // Use pdf-parse for more reliable Node.js extraction
      const data = await parser.getText();
      
      // pdf-parse gives us an array of pages.
      const pageTexts = data.pages
        .map((page) => page.text.trim())
        .filter((text) => text.length > 0);

      // If no pages found, fall back to the whole text
      const finalPages = pageTexts.length > 0 ? pageTexts : [data.text.trim()];

      console.log(`[Parser] Extracted ${finalPages.length} pages from PDF: ${file.name}`);

      return {
        type: "pdf",
        pageTexts: finalPages,
      };
    } catch (err) {
      console.error(`[Parser] PDF parsing failed for ${file.name}:`, err);
      throw new Error(`Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "txt" || extension === "md") {
    return {
      type: extension,
      pageTexts: [new TextDecoder().decode(bytes)],
    };
  }

  if (extension === "docx") {
    try {
      // Mammoth works best with Node.js Buffers in a Node environment
      const buffer = Buffer.from(bytes);
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages.length > 0) {
        console.warn(`[Parser] Mammoth warnings for ${file.name}:`, result.messages);
      }

      if (!result.value || result.value.trim().length === 0) {
        console.error(`[Parser] No text extracted from DOCX: ${file.name}`);
        throw new Error("The DOCX file appears to be empty or contains no extractable text.");
      }

      return {
        type: "docx",
        pageTexts: [result.value],
      };
    } catch (err) {
      console.error(`[Parser] DOCX parsing failed for ${file.name}:`, err);
      throw new Error(`Failed to parse DOCX: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`Unsupported file type: .${extension || "unknown"}`);
}

function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
