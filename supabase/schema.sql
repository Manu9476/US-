create table if not exists public.us_plus_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  dates jsonb not null default '[]'::jsonb,
  dreams jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  playlist jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.us_plus_workspaces
add column if not exists gallery jsonb not null default '[]'::jsonb;

alter table public.us_plus_workspaces enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_us_plus_workspaces_updated_at on public.us_plus_workspaces;

create trigger set_us_plus_workspaces_updated_at
before update on public.us_plus_workspaces
for each row
execute function public.set_updated_at();

drop policy if exists "Users can read their Us+ workspace" on public.us_plus_workspaces;
create policy "Users can read their Us+ workspace"
on public.us_plus_workspaces
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their Us+ workspace" on public.us_plus_workspaces;
create policy "Users can create their Us+ workspace"
on public.us_plus_workspaces
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their Us+ workspace" on public.us_plus_workspaces;
create policy "Users can update their Us+ workspace"
on public.us_plus_workspaces
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'us-plus-photos',
  'us-plus-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own Us+ photos" on storage.objects;
create policy "Users can view own Us+ photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'us-plus-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload own Us+ photos" on storage.objects;
create policy "Users can upload own Us+ photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'us-plus-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own Us+ photos" on storage.objects;
create policy "Users can update own Us+ photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'us-plus-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'us-plus-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own Us+ photos" on storage.objects;
create policy "Users can delete own Us+ photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'us-plus-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table if not exists public.us_plus_activity_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_label text,
  metadata jsonb not null default '{}'::jsonb,
  page_path text,
  user_agent text,
  occurred_at timestamptz not null default now()
);

alter table public.us_plus_activity_logs enable row level security;

create index if not exists us_plus_activity_logs_user_id_idx
on public.us_plus_activity_logs (user_id);

create index if not exists us_plus_activity_logs_event_type_idx
on public.us_plus_activity_logs (event_type);

create index if not exists us_plus_activity_logs_occurred_at_idx
on public.us_plus_activity_logs (occurred_at desc);

revoke all on public.us_plus_activity_logs from anon, authenticated;
grant insert on public.us_plus_activity_logs to anon, authenticated;
grant usage, select on sequence public.us_plus_activity_logs_id_seq to anon, authenticated;

drop policy if exists "Anonymous visitors can create Us+ activity logs" on public.us_plus_activity_logs;
create policy "Anonymous visitors can create Us+ activity logs"
on public.us_plus_activity_logs
for insert
to anon
with check (user_id is null);

drop policy if exists "Users can create own Us+ activity logs" on public.us_plus_activity_logs;
create policy "Users can create own Us+ activity logs"
on public.us_plus_activity_logs
for insert
to authenticated
with check (user_id is null or (select auth.uid()) = user_id);

create or replace view public.us_plus_admin_account_overview as
select
  users.id as user_id,
  users.email,
  users.created_at as account_created_at,
  users.last_sign_in_at,
  workspaces.updated_at as workspace_updated_at,
  workspaces.profile,
  jsonb_array_length(coalesce(workspaces.timeline, '[]'::jsonb)) as memory_count,
  jsonb_array_length(coalesce(workspaces.gallery, '[]'::jsonb)) as gallery_count,
  jsonb_array_length(coalesce(workspaces.dates, '[]'::jsonb)) as date_count,
  jsonb_array_length(coalesce(workspaces.dreams, '[]'::jsonb)) as goal_count,
  jsonb_array_length(coalesce(workspaces.notes, '[]'::jsonb)) as note_count,
  jsonb_array_length(coalesce(workspaces.playlist, '[]'::jsonb)) as song_count
from auth.users as users
left join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id;

create or replace view public.us_plus_admin_activity_summary as
select
  date_trunc('day', occurred_at) as activity_day,
  event_type,
  count(*) as event_count,
  count(distinct user_id) filter (where user_id is not null) as signed_in_user_count
from public.us_plus_activity_logs
group by date_trunc('day', occurred_at), event_type
order by activity_day desc, event_count desc;

create or replace view public.us_plus_admin_workspace_content as
select
  users.id as user_id,
  users.email,
  users.created_at as account_created_at,
  users.last_sign_in_at,
  workspaces.updated_at as workspace_updated_at,
  workspaces.profile,
  workspaces.timeline,
  workspaces.gallery,
  workspaces.dates,
  workspaces.dreams,
  workspaces.notes,
  workspaces.playlist
from auth.users as users
left join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id;

create or replace view public.us_plus_excel_accounts as
select
  users.id as user_id,
  users.email,
  users.created_at as account_created_at,
  users.last_sign_in_at,
  workspaces.updated_at as workspace_updated_at,
  workspaces.profile ->> 'one' as partner_one,
  workspaces.profile ->> 'two' as partner_two,
  workspaces.profile ->> 'since' as relationship_start_date,
  workspaces.profile ->> 'photoUrl' as couple_photo_url,
  jsonb_array_length(coalesce(workspaces.timeline, '[]'::jsonb)) as memory_count,
  jsonb_array_length(coalesce(workspaces.gallery, '[]'::jsonb)) as gallery_photo_count,
  jsonb_array_length(coalesce(workspaces.dates, '[]'::jsonb)) as date_count,
  jsonb_array_length(coalesce(workspaces.dreams, '[]'::jsonb)) as goal_count,
  jsonb_array_length(coalesce(workspaces.notes, '[]'::jsonb)) as note_count,
  jsonb_array_length(coalesce(workspaces.playlist, '[]'::jsonb)) as playlist_count
from auth.users as users
left join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id;

create or replace view public.us_plus_excel_activity_logs as
select
  logs.id as log_id,
  logs.occurred_at,
  logs.user_id,
  users.email,
  logs.event_type,
  logs.event_label,
  logs.page_path,
  logs.user_agent,
  logs.metadata ->> 'active_email' as active_email,
  logs.metadata ->> 'email' as metadata_email,
  logs.metadata ->> 'label' as metadata_label,
  logs.metadata ->> 'section' as section,
  logs.metadata ->> 'auth_state' as auth_state,
  logs.metadata ->> 'error_message' as error_message,
  logs.metadata ->> 'file_name' as file_name,
  logs.metadata ->> 'file_type' as file_type,
  logs.metadata ->> 'file_size' as file_size,
  logs.metadata ->> 'storage_path' as storage_path,
  logs.metadata ->> 'counts' as counts_json,
  logs.metadata as full_metadata
from public.us_plus_activity_logs as logs
left join auth.users as users
  on users.id = logs.user_id;

create or replace view public.us_plus_excel_memories as
select
  users.id as user_id,
  users.email,
  memory.item_order,
  memory.value ->> 'id' as memory_id,
  memory.value ->> 'title' as title,
  memory.value ->> 'date' as memory_date,
  memory.value ->> 'mood' as mood,
  regexp_replace(coalesce(memory.value ->> 'note', ''), '<[^>]+>', '', 'g') as note_text,
  memory.value ->> 'photoUrl' as photo_url,
  memory.value ->> 'photo' as photo,
  memory.value ->> 'createdAt' as created_at,
  memory.value ->> 'updatedAt' as updated_at
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.timeline, '[]'::jsonb)) with ordinality as memory(value, item_order)
  on true;

create or replace view public.us_plus_excel_gallery as
select
  users.id as user_id,
  users.email,
  photo.item_order,
  photo.value ->> 'id' as photo_id,
  photo.value ->> 'uploadedAt' as uploaded_at,
  photo.value ->> 'createdAt' as created_at,
  photo.value ->> 'optimizedAt' as optimized_at,
  photo.value ->> 'fileName' as file_name,
  photo.value ->> 'photoUrl' as photo_url,
  photo.value ->> 'thumbUrl' as thumbnail_url,
  photo.value ->> 'title' as legacy_title,
  photo.value ->> 'caption' as legacy_caption
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.gallery, '[]'::jsonb)) with ordinality as photo(value, item_order)
  on true;

create or replace view public.us_plus_excel_dates as
select
  users.id as user_id,
  users.email,
  date_plan.item_order,
  date_plan.value ->> 'id' as date_id,
  date_plan.value ->> 'title' as title,
  date_plan.value ->> 'when' as planned_for,
  date_plan.value ->> 'place' as location,
  regexp_replace(coalesce(date_plan.value ->> 'note', ''), '<[^>]+>', '', 'g') as note_text,
  date_plan.value ->> 'photo' as photo_url,
  date_plan.value ->> 'createdAt' as created_at,
  date_plan.value ->> 'updatedAt' as updated_at
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.dates, '[]'::jsonb)) with ordinality as date_plan(value, item_order)
  on true;

create or replace view public.us_plus_excel_goals as
select
  users.id as user_id,
  users.email,
  goal.item_order,
  goal.value ->> 'id' as goal_id,
  goal.value ->> 'title' as title,
  goal.value ->> 'target' as target_date,
  case
    when (goal.value ->> 'progress') ~ '^[0-9]+(\.[0-9]+)?$' then (goal.value ->> 'progress')::numeric
    else null
  end as progress_percent,
  goal.value ->> 'createdAt' as created_at,
  goal.value ->> 'updatedAt' as updated_at
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.dreams, '[]'::jsonb)) with ordinality as goal(value, item_order)
  on true;

create or replace view public.us_plus_excel_notes as
select
  users.id as user_id,
  users.email,
  note.item_order,
  note.value ->> 'id' as note_id,
  note.value ->> 'subject' as subject,
  case when note.value ->> 'locked' = 'true' then true else false end as is_hidden,
  note.value ->> 'reminderAt' as reminder_at,
  regexp_replace(coalesce(note.value ->> 'message', ''), '<[^>]+>', '', 'g') as message_text,
  note.value ->> 'photo' as photo_url,
  note.value ->> 'createdAt' as created_at,
  note.value ->> 'updatedAt' as updated_at
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.notes, '[]'::jsonb)) with ordinality as note(value, item_order)
  on true;

create or replace view public.us_plus_excel_playlist as
select
  users.id as user_id,
  users.email,
  track.item_order,
  track.value ->> 'id' as track_id,
  track.value ->> 'title' as title,
  track.value ->> 'artist' as artist,
  track.value ->> 'link' as link,
  track.value ->> 'createdAt' as created_at,
  track.value ->> 'updatedAt' as updated_at,
  track.value ->> 'openedAt' as opened_at,
  case when nullif(track.value ->> 'openedAt', '') is null then true else false end as is_unopened
from auth.users as users
join public.us_plus_workspaces as workspaces
  on workspaces.user_id = users.id
join lateral jsonb_array_elements(coalesce(workspaces.playlist, '[]'::jsonb)) with ordinality as track(value, item_order)
  on true;

revoke all on public.us_plus_admin_account_overview from anon, authenticated;
revoke all on public.us_plus_admin_activity_summary from anon, authenticated;
revoke all on public.us_plus_admin_workspace_content from anon, authenticated;
revoke all on public.us_plus_excel_accounts from anon, authenticated;
revoke all on public.us_plus_excel_activity_logs from anon, authenticated;
revoke all on public.us_plus_excel_memories from anon, authenticated;
revoke all on public.us_plus_excel_gallery from anon, authenticated;
revoke all on public.us_plus_excel_dates from anon, authenticated;
revoke all on public.us_plus_excel_goals from anon, authenticated;
revoke all on public.us_plus_excel_notes from anon, authenticated;
revoke all on public.us_plus_excel_playlist from anon, authenticated;
