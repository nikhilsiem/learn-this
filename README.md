# Learn This

Turn any topic into a structured course. Tell it what you want to learn, your skill level, your goal and how much time you have; an LLM plans a module graph with prerequisites, then writes each lesson, a quiz and a tutoring chat on demand.

**Live demo:** https://learn-this.vercel.app (sign in with Google)

## What it does

- **Course planner:** `POST /api/course/create` asks the model for a 4–8 module plan (concepts, prerequisites, time estimates) as JSON and stores it.
- **Streamed lessons:** each module's lesson is generated on first open, streamed to the page as Markdown, then cached in Postgres.
- **Quizzes:** generated per module; scores are saved and completing a module unlocks the modules that depend on it.
- **Module chat:** a tutor chat per module with saved conversations and auto-generated titles.
- **Progress and export:** per-user progress tracking, and export of a course to Markdown (download or copy).
- **Abuse limits:** per-user rate limiting on generation, backed by Upstash Redis with an in-memory fallback.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 and shadcn/Base UI · NextAuth v5 (Google) · Supabase Postgres · Gemini 2.5 Flash by default via the OpenAI SDK (swap in Groq/Llama, OpenRouter or Mistral with three env vars) · Upstash Redis

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example). All except the two Upstash keys are required.

| Variable | Where to get it |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your Vercel URL in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console, OAuth client (below) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase, Project Settings, API |
| `LLM_API_KEY` | Free key from aistudio.google.com/apikey (Gemini). Optional `LLM_BASE_URL` / `LLM_MODEL` switch to another OpenAI-compatible provider, e.g. Groq with Llama 3.3 70B |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Upstash, create a Redis database, REST API |

## Deploy for free

Everything below has a free tier that is enough for a demo.

1. **Supabase.** Create a project. In the SQL editor run, in order, the files in `supabase/migrations/` (`..._create_tables.sql`, `..._grant_permissions.sql`, `..._create_conversations.sql`). Optionally create a storage bucket named `course-uploads` for PDF uploads.
2. **LLM.** Create a free Gemini API key at aistudio.google.com/apikey and set it as `LLM_API_KEY`. To use an open-source model instead, set `LLM_BASE_URL` and `LLM_MODEL` for Groq or OpenRouter (see `.env.example`).
3. **Google OAuth.** In Google Cloud Console create an OAuth client (Web application) with:
   - Authorized JavaScript origin: `https://learn-this.vercel.app`
   - Authorized redirect URI: `https://learn-this.vercel.app/api/auth/callback/google`
   - Add `http://localhost:3000` and `http://localhost:3000/api/auth/callback/google` for local dev.
   - On the OAuth consent screen, publish the app (set it to **In production**). While it is in Testing, only listed test users can sign in.
4. **Upstash (optional).** Create a free Redis database and copy the REST URL and token. Without it, rate limits reset whenever a serverless instance restarts.
5. **Vercel.** Import this repository, add every variable from `.env.example` for Production, and deploy. Set `NEXTAUTH_URL` to the final URL.

Course generation calls the model several times per course, so the free tier's rate limits are the practical ceiling for a public demo.

## Project layout

```
app/api/          route handlers: course create/read, module lesson + quiz, chat, conversations, upload
app/course/       course overview, lesson and quiz pages
lib/              ai (model client), prompts, auth, supabase, ratelimit
components/       lesson viewer, quiz card, concept graph, chat sidebar, export menu
supabase/         schema and migrations
```
