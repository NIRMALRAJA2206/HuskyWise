# Huskywise

Huskywise is a research-first chatbot for academic and literature workflows.  
It ingests uploaded documents, retrieves relevant passages, and answers only from indexed material with page-aware citations.

## What this setup includes

- Dark black/blue Huskywise UI
- Upload support for `.pdf`, `.docx`, `.txt`, `.md`
- Local document indexing with chunking + embeddings
- Retrieval-augmented answers grounded in uploaded sources
- Citation display with `filename p.N`
- No login/auth/signup/account features

## Stack choice

This project uses `vercel/ai-chatbot` only as a base bootstrap, then replaces its auth/product layers with a custom, minimal Huskywise architecture focused on document-grounded research Q&A.

## Quick start

### Windows Setup (Using Anaconda)

If you are on Windows and have Anaconda or Miniconda installed, follow these steps:

1. **Create the Conda Environment:**
   Open **Anaconda Prompt** or **PowerShell** and run:
   ```bash
   # Create a new environment called 'husky' with Node.js
   conda create -n husky python=3.11 nodejs=20 -y

   # Activate the environment
   conda activate husky
   ```

2. **Install Project Dependencies:**
   ```bash
   npm install
   ```

3. **Setup Local AI (Ollama):**
   * Download and install Ollama for Windows from [ollama.com](https://ollama.com).
   * Pull the required models in a terminal:
     ```bash
     ollama pull llama3.1:8b
     ollama pull nomic-embed-text
     ```

4. **Configuration:**
   ```bash
   cp .env.example .env.local
   ```
   Ensure `.env.local` has `LLM_PROVIDER=ollama`.

5. **Start Huskywise:**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000).

### Standard Setup
1. Install dependencies:
...

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env.local
```

3. Recommended open-source local setup (Ollama):

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
ollama serve
```

4. Start Huskywise:

```bash
npm run dev
```

5. Open `http://localhost:3000`, upload your research files, and ask questions.

## Optional OpenAI fallback

Set these in `.env.local` if you do not want Ollama:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
```

## How grounding works

1. Uploaded documents are parsed by file type.
2. Content is split into overlapping chunks with page metadata.
3. Each chunk is embedded and stored in local JSON index at `.huskywise/index.json`.
4. For each question, Huskywise embeds the query, retrieves top chunks by cosine similarity, and prompts the model to answer only from that context.
5. Citations from retrieved chunks are displayed with page references.

## Notes

- Page references are exact for PDF pages.
- Non-paginated files (`.txt`, `.md`, `.docx`) are treated as page `1`.
- If evidence is insufficient, Huskywise is instructed to refuse answering from outside uploaded sources.
