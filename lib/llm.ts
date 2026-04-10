import type { ChatMessage } from "@/lib/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini";
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";

function shouldUseOllama(): boolean {
  return process.env.LLM_PROVIDER === "ollama" || Boolean(process.env.OLLAMA_BASE_URL);
}

function shouldUseOpenAI(): boolean {
  return process.env.LLM_PROVIDER === "openai" || Boolean(process.env.OPENAI_API_KEY);
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        console.warn(`[LLM] Retrying after error (attempt ${i + 1}/${retries}):`, err);
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function embedText(input: string): Promise<number[]> {
  return withRetry(async () => {
    if (shouldUseOllama()) {
      return embedWithOllama(input);
    }

    if (shouldUseOpenAI()) {
      return embedWithOpenAI(input);
    }

    throw new Error(
      "No embedding provider configured. Set OLLAMA_BASE_URL (recommended) or OPENAI_API_KEY.",
    );
  });
}

export async function completeGroundedAnswer(messages: ChatMessage[]): Promise<string> {
  return withRetry(async () => {
    if (shouldUseOllama()) {
      return chatWithOllama(messages);
    }

    if (shouldUseOpenAI()) {
      return chatWithOpenAI(messages);
    }

    throw new Error(
      "No chat model provider configured. Set OLLAMA_BASE_URL (recommended) or OPENAI_API_KEY.",
    );
  });
}

async function embedWithOllama(input: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_EMBED_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed (${response.status.toString()}).`);
  }

  const payload = (await response.json()) as { embeddings?: number[][] };
  if (!payload.embeddings?.[0]?.length) {
    throw new Error("Ollama embedding response is missing vectors.");
  }

  return payload.embeddings[0];
}

async function embedWithOpenAI(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const response = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBED_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding request failed (${response.status.toString()}).`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = payload.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("OpenAI embedding response is missing vectors.");
  return embedding;
}

async function chatWithOllama(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      options: {
        temperature: 0.1,
      },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat request failed (${response.status.toString()}).`);
  }

  const payload = (await response.json()) as {
    message?: {
      content?: string;
    };
  };

  const content = payload.message?.content?.trim();
  if (!content) throw new Error("Ollama chat response was empty.");
  return content;
}

async function chatWithOpenAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      temperature: 0.1,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI chat request failed (${response.status.toString()}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI chat response was empty.");
  return content;
}
