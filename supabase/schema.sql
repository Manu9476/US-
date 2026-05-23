create table if not exists public.us_plus_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  dates jsonb not null default '[]'::jsonb,
  dreams jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  playlist jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

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
