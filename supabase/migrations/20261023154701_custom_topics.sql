-- Remove the count/total-size caps while validating each individual topic.
create function public.valid_favorite_topics(values_to_check text[])
returns boolean language sql immutable strict set search_path = ''
as $$
  select coalesce(array_ndims(values_to_check), 1) = 1
    and not exists (
      select 1 from unnest(values_to_check) as topic
      where topic is null or char_length(btrim(topic)) not between 1 and 80
    );
$$;
revoke all on function public.valid_favorite_topics(text[]) from public, anon;
grant execute on function public.valid_favorite_topics(text[]) to authenticated;
alter table public.user_preferences drop constraint favorite_topics_limit;
alter table public.user_preferences drop constraint favorite_topics_size;
alter table public.user_preferences add constraint favorite_topics_valid
  check (public.valid_favorite_topics(favorite_topics));
