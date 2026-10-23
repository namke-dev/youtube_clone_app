-- Run once in the intended Supabase project's SQL editor or migration pipeline.
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_topics text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint favorite_topics_limit check (cardinality(favorite_topics) <= 8),
  constraint favorite_topics_size check (octet_length(array_to_string(favorite_topics, ',')) <= 2048)
);
alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from anon, authenticated;
grant select, insert, update on public.user_preferences to authenticated;
create policy "Read own preferences" on public.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own preferences" on public.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own preferences" on public.user_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
