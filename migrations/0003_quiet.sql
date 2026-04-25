create table if not exists quiet_round_entries (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player text not null check (player in ('a', 'b')),
  photo_data_url text not null,
  voice_note_text text,
  created_at timestamptz not null default now()
);

create index if not exists quiet_round_idx on quiet_round_entries (round_id);
