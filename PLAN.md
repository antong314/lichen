# Lichen — Build Plan

A two-player admiration game for couples. Web first, single device, AI-scored rounds. See the design doc for the product thesis; this document is purely the build plan.

## Architecture decisions (locked unless noted)

- **Web only for v0.** Phone may follow; do not pre-pay for it in the architecture.
- **Single device.** Both players use the same browser tab and pass the device back and forth. No realtime sync, no auth, no multi-device.
- **No auth in v0.** First-launch setup stores `couple_id` in `localStorage`. If localStorage is cleared, you re-setup. This is acceptable for a household tablet.
- **Server-side memory in Neon Postgres.** Encrypted at rest by default. No analytics on content. Revisit privacy posture before any real user beyond the designer.
- **Next.js (App Router) on Railway.** One repo, one deploy, API routes for all server-side calls.
- **Prompts as flat `.md` files in the repo.** Iterate without rebuilding logic. Loaded at request time.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | TypeScript, Tailwind, no `src/` dir |
| Hosting | Railway | One service, env vars for all keys |
| DB | Neon Postgres | Free tier; connection string only |
| DB client | `postgres` (Postgres.js) | Tagged-template SQL, no ORM |
| LLM | `@anthropic-ai/sdk`, Claude Sonnet 4.6 | Upgrade to Opus only if scoring quality demands it |
| Voice (Phase 6) | `groq-sdk`, Whisper | Behind an interface; text input is the v0 fallback |
| Prompt parsing | `gray-matter` | Frontmatter + markdown sections |
| Schema | Plain SQL migrations in `/migrations`, run by `scripts/migrate.ts` | Tracks applied migrations in `_migrations` table |

## Repo layout

```
/app                          # Next.js App Router
  /page.tsx                   # Setup or session entry
  /session/page.tsx           # Active session UI
  /api
    /score/route.ts           # POST — score one answer
    /transcribe/route.ts      # POST — Groq Whisper (Phase 6)
    /couples/route.ts         # POST — create couple
    /sessions/route.ts        # POST — start session
    /rounds/route.ts          # POST — record round result
/lib
  /claude.ts                  # Anthropic client + scoring fn
  /db.ts                      # Postgres.js client
  /groq.ts                    # Groq client + transcribe fn (Phase 6)
  /prompts.ts                 # Prompt loader (gray-matter)
  /rounds.ts                  # Round type registry + selection
/prompts
  /scoring
    base-rubric.md            # The 5 axes, defined once
    output-format.md          # JSON schema Claude returns
  /round-types
    admiration.md
    generosity-of-frame.md
    build-on.md               # (Phase 3)
    guess-the-answer.md       # (Phase 7)
    memory.md                 # (Phase 5)
    quiet.md                  # (Phase 7)
/migrations
  0001_init.sql
  0002_memory.sql             # (Phase 5)
/scripts
  migrate.ts                  # runs migrations in order, idempotent
/components
  /Hearts.tsx
  /PassDevice.tsx
  /AnswerInput.tsx
  ...
PLAN.md
README.md                     # Setup instructions only
.env.local.example
```

## Data model

```sql
-- 0001_init.sql
create table couples (
  id uuid primary key default gen_random_uuid(),
  player_a_name text not null,
  player_b_name text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ordinal int not null,
  type text not null,                    -- 'admiration' | 'generosity_of_frame' | ...
  prompt_id text not null,               -- stable id from the .md file
  prompt_text text not null,             -- the actual prompt shown (resilient to template edits)
  answering_player text not null,        -- 'a' | 'b'
  answer_text text not null,
  scores jsonb not null,                 -- { hearts, axes_fired, reason }
  receiver_tiebreaker jsonb,             -- nullable, set by Phase 4
  created_at timestamptz not null default now()
);

-- 0002_memory.sql (Phase 5)
create table memory_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null,                    -- 'glossary' | 'pattern' | 'reference'
  content text not null,
  source_round_id uuid references rounds(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on memory_entries (couple_id, kind);
```

The `scores` and `receiver_tiebreaker` columns are deliberately `jsonb` — the shape will evolve and we don't want migrations every time the rubric changes.

## Prompt file format

Each round-type file is self-contained. Example `admiration.md`:

```markdown
---
type: admiration
axis_weights:
  specificity: heavy
  groundedness: heavy
  noticing: medium
  non_obviousness: medium
  generosity_of_frame: bonus
---

# User Prompts

- id: small_unnoticed
  text: Name a small thing your partner did in the last week that most people wouldn't have noticed, but you did.
- id: hidden_strength
  text: Name something your partner does that nobody outside your household would ever see.
- ...

# Scoring Instructions

You are scoring an admiration-round answer. Apply the base rubric (loaded separately).
For this round type, weight specificity and groundedness most heavily. ...
```

`/lib/prompts.ts` parses frontmatter for axis weights, splits the body into sections by `# Header`, and exposes a typed `RoundTypeDefinition`. Iteration on a prompt is a file edit and a request — no rebuild.

## Phasing

Each phase is shippable and playable. Don't start Phase N+1 until Phase N has been played end-to-end at least once.

### Phase 1 — Scaffold + one-round prototype

**Goal:** prove the scoring loop feels right before building any scaffolding around it.

- `npx create-next-app@latest` (TS, Tailwind, App Router, no `src/`)
- Single page at `/`. One hardcoded admiration prompt. Textarea + submit.
- `/api/score` calls Claude with the base rubric + admiration scoring prompt. Returns `{ hearts, axes_fired, reason }` as structured JSON (use Anthropic's tool-use or strict JSON output).
- Hearts component (1–3 SVG hearts, three-state).
- Render reason as one sentence below hearts.
- No DB, no session, no second player, no styling beyond functional Tailwind.
- `.env.local` with `ANTHROPIC_API_KEY`. `.env.local.example` checked in.
- Deploy to Railway end-to-end to confirm the pipeline works before going further.

**Done when:** the designer has played 5+ single rounds and the scoring feels close enough that the rubric is the right rubric. If it doesn't, iterate the prompts in `/prompts` until it does — don't move on.

### Phase 2 — Persistence + sessions

**Goal:** real session shape — 5 rounds, 2 players, a clear ending.

- Supabase project provisioned. URL, anon key, service role key in Railway env vars.
- Run `0001_init.sql`.
- First-launch setup screen: "What are your names?" → POST `/api/couples` → store `couple_id` in `localStorage`.
- Session screen: 5 admiration rounds. Players alternate (A, B, A, B, A). Each turn:
  1. "Pass to [name]" full-screen interstitial. Tap to begin.
  2. Prompt shown. Textarea + submit.
  3. Score shown to the answering player only (their hearts and reason).
  4. Tap to continue → next turn's interstitial.
- After round 5, end-of-session summary: all 10 rounds (oh wait — 5 rounds total, 5 prompts, alternating who answers, so 5 records). Show all 5 with hearts and reasons.
- AI actively closes the session. No "play another round?" button. Tap to return to home.
- Round records persisted to `rounds` table after each score.
- Prompts selected at random from the admiration pool, no repeats within a session.

**Done when:** the designer can play a complete session, close the laptop, reopen it the next day, and the previous session is in the DB.

### Phase 3 — Round type variety

**Goal:** sessions stop feeling samey by round 3.

- Add `generosity-of-frame.md` and `build-on.md`.
- `/lib/rounds.ts` exposes a registry of round types. A session is now: a sequence of round types selected by some simple policy (start with admiration, mix in others, end with admiration).
- Generosity-of-frame: same UI as admiration, different scoring weights.
- Build-on: structurally different. Both players answer in alternation within a single round, building on each other's previous answer. Round ends when one player taps "I'm out." The other player wins. Scoring is cumulative — each contribution is scored against an escalating bar.
- Build-on requires a different DB shape — multiple `answer_text` per round. Either:
  - Store as `jsonb` array in a single `rounds` row, or
  - Add a `round_turns` table.
  - **Decide at start of phase.** Lean toward jsonb to avoid premature normalization.

**Done when:** a session uses at least three different round types and they each feel distinct.

### Phase 4 — Receiver tiebreakers

**Goal:** the noticing axis becomes real. The receiver gets a voice.

- After the answering player sees their score, brief screen for the receiving player: "Did you know they'd noticed that?" (Yes / No / Sort of). Optional follow-up tap: "Was it specific?" (1–3 hearts).
- Receiver's input is written to `receiver_tiebreaker` and the noticing axis is re-scored server-side (a small deterministic adjustment, not a second Claude call — the AI's job is interpretation, the receiver's job is ground truth).
- Updated score is what's persisted and shown in the session summary.

**Done when:** the designer plays a session with their partner where receiver tiebreakers fire on at least 3 of 5 rounds and the rescoring feels right.

### Phase 5 — Memory layer

**Goal:** the moat starts forming. The game starts to know this couple.

- Run `0002_memory.sql`.
- After each round (server-side, async), a second Claude call: "Given this answer and the existing glossary for this couple, propose 0–3 new glossary entries, patterns, or references worth remembering." Returns structured JSON. Insert into `memory_entries`.
- Scoring prompts now include the couple's glossary as context: "Here are loaded references this couple uses: [...]. Treat references to these as more specific than they would otherwise read."
- Memory round type added: AI surfaces a previous-session reference and asks for an answer that builds on it. Requires at least one prior session with memory entries.
- Settings screen: list memory entries, allow per-entry deletion. **This is the privacy escape hatch and must ship in this phase.**

**Done when:** after 5+ sessions, the designer can point to specific glossary entries the AI extracted that genuinely capture loaded vocabulary, and a memory round fires on a real reference and feels good.

### Phase 6 — Voice via Groq

**Goal:** drop typing friction. Voice should feel obviously better than text by the end of this phase.

- `/api/transcribe`: accepts `audio/webm` blob, calls Groq Whisper, returns text.
- Browser: MediaRecorder captures while the player holds a button (or taps to start/stop — decide during build). Chunked upload at stop.
- Voice/text toggle in settings; default to voice once it works well enough.
- Latency budget: < 2s from stop-recording to text-rendered. If Groq is slow, surface "Transcribing..." rather than blocking the UI.
- Transcribed text shown to the player for confirmation before scoring (catch obvious mishears).

**Done when:** the designer prefers voice to text in a real session.

### Phase 7 — Guess-the-answer + quiet rounds

**Goal:** the harder round types. Saved for last because they're structurally different and one of them (guess-the-answer) is genuinely risky.

**Guess-the-answer:**
- Round flow: prompt about Player A. Player B answers (predicting). Player A then answers for real. Comparison.
- Scoring split: Player B gets an *attention score* (specificity, non-obviousness, groundedness — Claude scores). Then Player A taps an *accuracy score* (1–3 hearts: how close did they get?).
- **Misses framed as gifts.** When accuracy is low, the AI's reason names this as a blind spot worth noticing, not a failure. The exact wording belongs in the prompt and needs to be iterated carefully.
- Exit ramp: after a low-accuracy round, the AI asks Player A whether they want to talk about the gap. If yes, the game pauses and shows a single screen: "Take as long as you need. Tap when ready." No coaching, no follow-up scoring. The game gets out of the way.

**Quiet:**
- No scoring. Each player picks one photo from their device that captures something they admire about the other. Photos uploaded to Supabase Storage (now we need it). Side-by-side render. Each player taps to record a short voice note (Phase 6 voice infra reused) explaining the choice. The voice notes play. End of round.
- Photos and voice notes persisted to the round record.

**Done when:** both round types have been played in real sessions and the guess-the-answer exit ramp has been triggered at least once and worked.

## Open questions (deferred)

- Session frequency / cadence default. Defer until after 10+ real sessions.
- Carryover measurement. The design doc flags this as the real product. A weekly check-in question is the obvious shape, but design defers to v2.
- Long-distance / two-device couples. Likely a different product.
- Hard-conflict couples. Explicitly out of scope per design doc.
- Photo lifecycle: do photos from quiet rounds get auto-deleted after N days? Privacy concern, defer.
- A "delete everything" button (full data wipe for the couple). Should ship before any user beyond the designer.

## Setup checklist (before Phase 1)

- [ ] Anthropic API key (designer's own)
- [ ] Supabase project created (used in Phase 2, but provision now)
- [ ] Railway account + new project
- [ ] Groq API key (used in Phase 6, provision when needed)
- [ ] Decide: which Claude model for v0 (recommend `claude-sonnet-4-6`)
- [ ] `.env.local.example` lists every env var the app expects, with comments

## Non-goals for v0

These are deliberately out of scope. If they come up, push back.

- Auth, accounts, password reset
- Multi-couple support on one device
- Cross-device sync
- Realtime / multiplayer over network
- Analytics, telemetry, A/B testing
- Notifications / engagement loops / streaks
- Native mobile apps
- Internationalization
- Tests beyond ad-hoc playtesting (the rubric is the test; real couples are the validators)
- A landing page or marketing site
