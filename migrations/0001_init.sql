create extension if not exists "pgcrypto";

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  player_a_name text not null,
  player_b_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists sessions_couple_idx on sessions (couple_id, started_at desc);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ordinal int not null,
  type text not null,
  prompt_id text not null,
  prompt_text text not null,
  answering_player text not null check (answering_player in ('a', 'b')),
  answer_text text not null,
  scores jsonb not null,
  receiver_tiebreaker jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rounds_session_idx on rounds (session_id, ordinal);
