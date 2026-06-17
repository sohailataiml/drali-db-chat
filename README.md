# Dr. Ali Database Assistant (drali-db-chat)

An internal AI chat assistant that lets the Dr. Ali Plastic Surgery & AMAE Med Spa team query their backend PostgreSQL database using natural language. Built on Next.js and Anthropic's Claude, the assistant interprets a question, retrieves the relevant data from Postgres, and returns a clear, conversational answer — no SQL knowledge required.

---

## Overview

This application acts as a conversational layer on top of the Dr. Ali backend database. Staff can ask questions in plain English (e.g. *"How many new leads came in this week?"*) and the assistant handles the underlying data lookup automatically.

Under the hood, the assistant follows a **tool-calling** pattern powered by the Model Context Protocol (MCP) approach: instead of guessing or hallucinating answers, Claude is given a defined tool that can safely query the Postgres database, decides when that tool is needed, and uses the real returned data to compose its final response. This keeps every answer grounded in the actual database rather than the model's general knowledge.

---

## How It Works

1. **User sends a message** through the chat interface in the browser.
2. **The Next.js API route** (`app/api/chat`) receives the message and forwards the conversation to Claude via the Anthropic API.
3. **Claude evaluates the request.** If answering requires live data — lead counts, appointment records, patient inquiries, campaign stats, etc. — Claude calls the database tool rather than answering from memory.
4. **The database tool runs a query** against the PostgreSQL instance (via the `pg` driver) and returns structured results back to Claude.
5. **Claude composes a final, natural-language answer** using the real data returned from the database, which is streamed back to the user in the chat UI.

This request → tool call → database → response loop is what allows the assistant to stay accurate and up to date with whatever is currently in the database, rather than relying on a static or outdated understanding of the data.

```
┌──────────────┐      ┌───────────────────┐      ┌────────────────────┐      ┌──────────────────┐
│   Chat UI     │ ───▶ │  Next.js API Route │ ───▶ │   Claude (Anthropic)│ ───▶ │  PostgreSQL Tool   │
│ (page.tsx)    │ ◀─── │  (app/api/chat)    │ ◀─── │   tool-calling logic│ ◀─── │  (pg + DATABASE_URL)│
└──────────────┘      └───────────────────┘      └────────────────────┘      └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| UI | React 18, Tailwind CSS, `react-markdown` |
| AI Orchestration | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) |
| Model Provider | [`@ai-sdk/anthropic`](https://www.npmjs.com/package/@ai-sdk/anthropic) — Claude |
| Database Access | [`pg`](https://node-postgres.com/) (node-postgres) |
| Validation | [Zod](https://zod.dev/) |
| Language | TypeScript |

---

## Project Structure

```
drali-db-chat/
├── app/
│   ├── api/
│   │   └── chat/          # API route — handles chat requests, Claude calls, and DB tool execution
│   ├── globals.css         # Global Tailwind styles
│   ├── layout.tsx           # Root app layout
│   └── page.tsx              # Chat interface (frontend)
├── components/              # Reusable UI components for the chat experience
├── .env.local.example       # Template for required environment variables
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

- Node.js 18.17 or later
- npm
- Access to the Dr. Ali backend PostgreSQL database (connection string)
- An Anthropic API key

---

## Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/sohailataiml/drali-db-chat.git
cd drali-db-chat
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Copy the example file and fill in real credentials:
```bash
cp .env.local.example .env.local
```

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_URL=postgresql://user:password@host:port/database
```

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | API key used to authenticate requests to Claude. |
| `DATABASE_URL` | Postgres connection string for the Dr. Ali backend database. |

> ⚠️ **Never commit `.env.local` or real credentials to version control.** The `.env.local.example` file should only ever contain placeholder values.

**4. Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

**5. Build for production**
```bash
npm run build
npm run start
```

---

## Usage

1. Open the chat interface in the browser.
2. Ask a question about the data in plain language — for example:
   - "How many leads have we received this month?"
   - "Show me the most recent appointment requests."
   - "What's the breakdown of inquiries by source?"
3. The assistant determines whether the question requires a database lookup, retrieves the relevant records, and responds with a clear summary grounded in the actual data.

---

## Security Notes

- Database credentials and API keys are loaded exclusively from environment variables and are never exposed to the browser/client.
- All database access goes through a single, controlled server-side execution path — the model cannot run arbitrary, unrestricted commands against the database.
- It is recommended that the database user configured in `DATABASE_URL` be scoped with **read-only, least-privilege access** appropriate to this assistant's purpose.

---

## Maintainer

Developed and maintained by **Techrizq** for Dr. Ali Plastic Surgery & AMAE Med Spa.
