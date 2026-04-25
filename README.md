# Lichen

A two-player admiration game for couples. Web first, single device, AI-scored rounds.

See [PLAN.md](./PLAN.md) for the architecture and phasing. Design doc lives outside the repo.

## Local development

Requires Node 20+ and an `.env.local` with:

```
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Then:

```sh
npm install
npm run migrate    # apply SQL migrations to your Neon DB
npm run dev        # http://localhost:3000
```

## Iterating on prompts

Round-type prompts and the base rubric live in `/prompts/` as flat markdown files. Edit them, save, and reload the next request — no rebuild. The format:

- `/prompts/scoring/base-rubric.md` — the five axes (used by every scoring call)
- `/prompts/round-types/<type>.md` — frontmatter (axis weights), `# User Prompts` (`## id`-keyed pool), `# Scoring Instructions`

## Layout

- `/app` — Next.js App Router (pages + `/api` routes)
- `/lib` — db, prompts loader, Claude/Groq clients, round registry
- `/components` — UI components
- `/hooks` — React hooks (voice recorder)
- `/migrations` — SQL migrations, run by `scripts/migrate.ts`
- `/prompts` — all prompts as markdown
