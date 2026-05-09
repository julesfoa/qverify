# Wikipedia Profile Page — Design Spec
Date: 2026-05-08

## Overview

A feature that scrapes the internet across four sources, synthesizes the data with Claude into a Wikipedia-style biographical article, and renders it as an editable profile page within the app. Each paragraph is individually editable and fact-checked by AI after generation.

---

## Data Flow

```
User inputs name + optional profile URL
         │
         ▼
  [4 scrapers run in parallel]
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  │   GitHub     │  Twitter/X   │  LinkedIn    │  Web Search  │
  │  @octokit    │  twitter-    │  Playwright  │  Serper.dev  │
  │  /rest       │  api-v2      │  + session   │  REST API    │
  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   [mini Claude call per source — structured JSON summary]
   { bio, career, education, projects, interests, notable_work }
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                                │
                                ▼
              [Final Claude synthesis — Wikipedia prose]
                  Array of Paragraph objects, streamed
                                │
                                ▼
                  Profile page renders paragraphs live
                                │
                                ▼
              [FactChecker runs per paragraph, streamed]
              Badges update: pending → verified ✓ / flagged ⚠
                                │
                                ▼
                  User edits paragraph by paragraph
                  Edits saved to Supabase in real time
```

---

## Components

### 1. `PageGenerator` — server-side orchestrator
- Receives `{ name: string, profileUrl?: string }` from the user
- Fans out to all 4 scrapers in parallel using `Promise.allSettled` (one failure doesn't block the rest)
- Each scraper result passes through a mini Claude call returning a structured JSON summary
- Final Claude call receives all summaries and writes the article as a `Paragraph[]` stream
- Delivers paragraphs via Server-Sent Events so the UI populates in real time

### 2. Source scrapers (4 independent modules)

| Module | Source | Method | Auth |
|---|---|---|---|
| `github-scraper` | GitHub | `@octokit/rest` public API | None (public profiles) |
| `twitter-scraper` | Twitter/X | `twitter-api-v2`, API v2 | User's OAuth token (already logged in) |
| `linkedin-scraper` | LinkedIn | Playwright headless browser | User's browser session cookies |
| `websearch-scraper` | Open web | Serper.dev REST API | API key (env var) |

Each scraper returns raw data. A per-source mini Claude prompt normalizes it into:
```ts
type SourceSummary = {
  bio?: string
  career?: Array<{ title: string; org: string; period: string }>
  education?: Array<{ degree: string; institution: string; year?: string }>
  projects?: Array<{ name: string; description: string; url?: string }>
  interests?: string[]
  notable_work?: string[]
}
```

LinkedIn is the most fragile source. If it fails or returns empty, the generator continues with a note in the article that LinkedIn data was unavailable.

### 3. `ProfilePage` — frontend

Renders the article as a list of paragraph blocks. Each block has two modes:

**Read mode:**
- Rendered paragraph text
- Section label (e.g. "Career", "Early Life")
- Fact-check badge: `pending` (spinner) → `verified ✓` (green) / `uncertain ?` (yellow) / `flagged ⚠` (red)
- Click anywhere on the paragraph to enter edit mode

**Edit mode:**
- Inline textarea pre-filled with current text
- Save / Cancel buttons
- Saving writes `editedText` to Supabase immediately

### 4. `FactChecker` — server-side, runs after generation

Iterates over each paragraph sequentially, sends it to Claude with a `search_web` tool. Returns:
```ts
type FactCheckResult = {
  verdict: "verified" | "uncertain" | "flagged"
  note?: string       // short human-readable explanation
  sourceUrl?: string  // URL that supports or contradicts the claim
}
```
Results stream back via SSE so badges update progressively as each paragraph resolves.

---

## Data Model

```ts
type Paragraph = {
  id: string
  section: string         // "Early Life" | "Career" | "Projects" | "Interests" | ...
  text: string            // Claude-generated original
  editedText?: string     // user's override (null = not yet edited)
  factCheck?: {
    verdict: "verified" | "uncertain" | "flagged"
    note?: string
    sourceUrl?: string
  }
  order: number
}

type ProfilePage = {
  id: string
  userId: string
  name: string
  generatedAt: Date
  lastEditedAt?: Date
  paragraphs: Paragraph[]
}
```

### Supabase tables

```sql
create table profile_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  generated_at timestamptz not null default now(),
  last_edited_at timestamptz
);

create table paragraphs (
  id uuid primary key default gen_random_uuid(),
  profile_page_id uuid references profile_pages not null,
  section text not null,
  text text not null,
  edited_text text,
  fact_verdict text check (fact_verdict in ('verified', 'uncertain', 'flagged')),
  fact_note text,
  fact_source_url text,
  "order" integer not null
);
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Deployment | Vercel |
| Database | Supabase (Postgres) |
| AI | Claude API — `claude-sonnet-4-6` |
| GitHub scraping | `@octokit/rest` |
| Twitter scraping | `twitter-api-v2` |
| LinkedIn scraping | `playwright` |
| Web search | Serper.dev API |
| Streaming | Server-Sent Events (SSE) via Next.js Route Handlers |
| UI | shadcn/ui components |

---

## AI Calls Summary

| Call | Model | Input | Output |
|---|---|---|---|
| GitHub summarizer | claude-haiku-4-5 | Raw GitHub API data | `SourceSummary` JSON |
| Twitter summarizer | claude-haiku-4-5 | Raw tweets + bio | `SourceSummary` JSON |
| LinkedIn summarizer | claude-haiku-4-5 | Scraped page HTML | `SourceSummary` JSON |
| Web search summarizer | claude-haiku-4-5 | Search result snippets | `SourceSummary` JSON |
| Wikipedia synthesis | claude-sonnet-4-6 | 4× `SourceSummary` | `Paragraph[]` streamed |
| Fact checker (×N) | claude-sonnet-4-6 | Paragraph text + web search tool | `FactCheckResult` |

Mini-summarizers use Haiku for speed and cost. Synthesis and fact-checking use Sonnet for quality.

---

## Error Handling

- Each scraper wrapped in try/catch — failure returns `null`, generator proceeds with remaining sources
- If all 4 scrapers fail, return a clear error: "Could not gather enough data to generate a profile"
- LinkedIn scrape timeouts capped at 15s to avoid blocking the pipeline
- Fact-checker failures per paragraph set verdict to `"uncertain"` with note "Could not verify"

---

## Out of Scope (for now)

- Links embedded in the article text
- Profile pictures / images
- Multiple profile pages per user
- Sharing / public profile URLs
