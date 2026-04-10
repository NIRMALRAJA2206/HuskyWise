"use client";

import { FileText, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Citation = {
  chunkId: string;
  documentId: string;
  fileName: string;
  page: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

type IndexedDocument = {
  id: string;
  fileName: string;
  pageCount: number;
  chunkCount: number;
  uploadedAt: string;
};

export default function HuskywisePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Upload your research materials, then ask questions. I will answer only from uploaded sources and cite each source with page references.",
    },
  ]);
  const [input, setInput] = useState("");
  const [docs, setDocs] = useState<IndexedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void refreshDocuments();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  async function refreshDocuments() {
    const response = await fetch("/api/documents");
    if (!response.ok) return;
    const payload = (await response.json()) as { documents: IndexedDocument[] };
    setDocs(payload.documents);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    setError(null);
    setStatus("Indexing documents...");
    setIsUploading(true);

    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        indexed?: number;
        error?: string;
        partialErrors?: string[];
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Upload failed");
      }

      if (payload.partialErrors && payload.partialErrors.length > 0) {
        setError(`Indexed ${payload.indexed ?? 0} file(s), but some failed: ${payload.partialErrors.join(", ")}`);
        setStatus(null);
      } else {
        setStatus(`Successfully indexed ${payload.indexed ?? 0} file(s).`);
      }
      await refreshDocuments();
      event.target.value = "";
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
      setStatus(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isAsking) return;

    setError(null);
    setStatus(null);
    setInput("");
    setIsAsking(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = (await response.json()) as {
        answer?: string;
        citations?: Citation[];
        error?: string;
      };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || "Chat request failed");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: payload.answer,
          citations: payload.citations ?? [],
        },
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Chat failed");
      setMessages(nextMessages);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <main className="shell">
      <header className="header">
        <div>
          <div className="brand">Huskywise</div>
          <div className="subtitle">
            Research-first document QA with grounded answers and citations
          </div>
        </div>
      </header>

      <section className="grid">
        <aside className="panel left-panel">
          <h2 className="section-title">Knowledge Base</h2>
          <p className="muted small">
            Upload PDFs, DOCX, TXT, or MD files. Huskywise indexes them for retrieval with page-aware citations.
          </p>

          <div className="uploader">
            <label className="small muted" htmlFor="research-files">
              Add research material
            </label>
            <input
              id="research-files"
              type="file"
              multiple
              accept=".pdf,.txt,.md,.docx"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <div style={{ marginTop: "0.7rem" }}>
              <button className="button" disabled={isUploading} type="button">
                {isUploading ? "Indexing..." : "Ready to Index"}
              </button>
            </div>
          </div>

          {status ? (
            <p className="small muted" style={{ marginTop: 0 }}>
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="small error" style={{ marginTop: 0 }}>
              {error}
            </p>
          ) : null}

          <h3 className="section-title" style={{ marginTop: "1rem", marginBottom: "0.6rem" }}>
            Indexed Documents ({docs.length})
          </h3>
          <div className="doc-list">
            {docs.length === 0 ? (
              <div className="doc-item">
                <p className="doc-name muted">No files indexed yet.</p>
              </div>
            ) : (
              docs.map((doc) => (
                <div className="doc-item" key={doc.id}>
                  <p className="doc-name">
                    <FileText size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                    {doc.fileName}
                  </p>
                  <div className="doc-meta">
                    {doc.pageCount} page(s) • {doc.chunkCount} chunks
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="panel chat-panel">
          <div className="messages">
            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={`${message.role}-${index.toString()}`}>
                {message.content}
                {message.role === "assistant" && message.citations?.length ? (
                  <div className="citations">
                    {message.citations.map((citation) => (
                      <span
                        className="citation"
                        key={`${citation.chunkId}-${citation.page.toString()}`}
                      >
                        {citation.fileName} p.{citation.page}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {isAsking ? (
              <article className="message assistant">
                <Loader2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                Retrieving sources and drafting grounded answer...
              </article>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form className="composer" onSubmit={handleAsk}>
            <textarea
              placeholder="Ask about your uploaded research material..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isAsking}
            />
            <button className="button" disabled={isAsking || !input.trim()} type="submit">
              <Send size={16} />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
