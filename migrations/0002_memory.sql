create table if not exists memory_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null check (kind in ('glossary', 'pattern', 'reference')),
  content text not null,
  source_round_id uuid references rounds(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists memory_couple_kind_idx on memory_entries (couple_id, kind);
create index if not exists memory_couple_recent_idx on memory_entries (couple_id, created_at desc);
