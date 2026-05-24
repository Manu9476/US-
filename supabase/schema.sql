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

revoke all on public.us_plus_admin_account_overview from anon, authenticated;
revoke all on public.us_plus_admin_activity_summary from anon, authenticated;
revoke all on public.us_plus_admin_workspace_content from anon, authenticated;
