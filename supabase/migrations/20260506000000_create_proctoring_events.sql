create table if not exists proctoring_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  session_type text not null,   -- 'daily' or 'mock_interview'
  strike_number int not null,
  terminated   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table proctoring_events enable row level security;

create policy "users can insert own events"
  on proctoring_events for insert
  with check (auth.uid() = user_id);
