# Huskywise Setup Guide for Windows

This guide will walk you through setting up Huskywise on your new Windows laptop from scratch.

---

## 1. Prerequisites (Install these first)

### A. Install Git
1. Download Git from [git-scm.com](https://git-scm.com/download/win).
2. Run the installer. You can keep all default settings.

### B. Install Node.js
1. Download the "LTS" version from [nodejs.org](https://nodejs.org/).
2. Run the installer. This will also install `npm`.

### C. Install Ollama (Local AI)
You have two options on Windows:

**Option 1: Windows Subsystem for Linux (WSL) - Recommended for Developers**
1. Open PowerShell as Administrator and run: `wsl --install` (Restart your computer after).
2. Open your WSL terminal (e.g., Ubuntu).
3. Run the command you provided:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

**Option 2: Direct Windows Installer**
1. Download from [ollama.com/download/windows](https://ollama.com/download/windows).
2. Run the `.exe` installer.

---

## 2. Project Setup

### A. Clone the Repository
Open your terminal (Command Prompt, PowerShell, or Git Bash) and run:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd huskywise
```

### B. Install Dependencies
```bash
npm install
```

### C. Environment Configuration
1. Create a `.env.local` file in the root folder:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and ensure it has these settings:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_CHAT_MODEL=llama3.1:8b
   OLLAMA_EMBED_MODEL=nomic-embed-text
   ```

---

## 3. Prepare AI Models
Open your terminal and run these commands to download the necessary AI models:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

---

## 4. Run the Application

Now you are ready to start the project:

```bash
npm run dev
```

1. Open your browser to [http://localhost:3000](http://localhost:3000).
2. Upload a PDF/DOCX.
3. Start chatting!

---

## 5. How to push your local changes to GitHub
If you haven't linked this local folder to your GitHub yet:

1. Create a **new empty repository** on [github.com](https://github.com).
2. Copy the URL (it looks like `https://github.com/username/huskywise.git`).
3. In your local terminal, run:
   ```bash
   # Add your GitHub as the "remote"
   git remote add origin <PASTE_YOUR_URL_HERE>

   # Push the code
   git push -u origin main
   ```

---
*Generated for Huskywise Setup - April 10, 2026*
