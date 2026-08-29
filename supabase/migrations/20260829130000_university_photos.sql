-- ---------------------------------------------------------------------------
-- University photos
--
-- Two sources of campus imagery, because neither alone covers the country:
--
--   1. A curated cover image per university, imported from Wikimedia Commons
--      with its licence and author recorded. Free-licensed photography only
--      exists for a minority of Myanmar institutions, so most rows stay NULL
--      and the UI keeps falling back to the short-name badge.
--   2. Member submissions from verified students of that university, which is
--      the only realistic way to cover the remaining campuses. These are held
--      for moderation before anyone else sees them.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Curated cover image
--
-- Attribution is stored alongside the file rather than derived at render time:
-- CC BY-SA requires naming the author and licence, and the importer is the
-- only place that reliably knows them.
-- ---------------------------------------------------------------------------

alter table public.universities
  add column if not exists cover_image_path text,
  add column if not exists cover_image_credit text,
  add column if not exists cover_image_source_url text,
  add column if not exists cover_image_license text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'universities_cover_image_credit_check'
  ) then
    alter table public.universities
      add constraint universities_cover_image_credit_check
      check (cover_image_credit is null or char_length(cover_image_credit) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'universities_cover_image_license_check'
  ) then
    alter table public.universities
      add constraint universities_cover_image_license_check
      check (cover_image_license is null or char_length(cover_image_license) <= 120);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Member submitted photos
-- ---------------------------------------------------------------------------

create table if not exists public.university_photos (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  uploader_id uuid references public.profiles (id) on delete set null,
  image_path text not null,
  caption text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.admin_users (user_id) on delete set null,
  review_note text,
  constraint university_photos_status_check
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  constraint university_photos_caption_check
    check (caption is null or char_length(caption) <= 280),
  constraint university_photos_image_path_check
    check (char_length(image_path) between 1 and 500)
);

-- Approved photos are read constantly on the university page; pending ones are
-- only read by the uploader and the moderation queue.
create index if not exists university_photos_approved_idx
  on public.university_photos (university_id, created_at desc)
  where status = 'APPROVED';

create index if not exists university_photos_queue_idx
  on public.university_photos (status, created_at)
  where status = 'PENDING';

create index if not exists university_photos_uploader_idx
  on public.university_photos (uploader_id);

create index if not exists university_photos_reviewed_by_idx
  on public.university_photos (reviewed_by)
  where reviewed_by is not null;

alter table public.university_photos enable row level security;

-- Everyone signed in sees approved photos. Uploaders additionally see their own
-- submissions so a pending or rejected upload does not silently vanish.
drop policy if exists "members read approved university photos" on public.university_photos;
create policy "members read approved university photos" on public.university_photos
  for select to authenticated
  using (status = 'APPROVED' or uploader_id = (select auth.uid()));

-- Only a verified student of that university may contribute. Verification is
-- what makes a submission trustworthy enough to be worth moderating at all.
drop policy if exists "verified students submit university photos" on public.university_photos;
create policy "verified students submit university photos" on public.university_photos
  for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and status = 'PENDING'
    and (select private.is_active_user())
    and exists (
      select 1
      from public.student_profiles s
      where s.user_id = (select auth.uid())
        and s.university_id = university_photos.university_id
        and s.verification_status = 'verified'
    )
  );

-- Uploaders may withdraw their own submission. Moderation decisions are made by
-- the Java console through the service key, which bypasses these policies.
drop policy if exists "uploaders withdraw university photos" on public.university_photos;
create policy "uploaders withdraw university photos" on public.university_photos
  for delete to authenticated
  using (
    uploader_id = (select auth.uid())
    and status = 'PENDING'
  );

-- ---------------------------------------------------------------------------
-- Storage
--
-- One bucket serves both sources. Curated covers are written by the importer
-- under `cover/`, which no member can reach because the member write policies
-- require the first path segment to equal the caller's own id. Submissions live
-- at `<user id>/<file>` exactly like avatars and post media.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('university-media', 'university-media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- The existing policies are replaced rather than duplicated so all three
-- buckets stay described in one place.
drop policy if exists "takka media is readable" on storage.objects;
create policy "takka media is readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('avatars', 'post-media', 'university-media'));

drop policy if exists "members upload their own media" on storage.objects;
create policy "members upload their own media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-media', 'university-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_active_user())
  );

drop policy if exists "members replace their own media" on storage.objects;
create policy "members replace their own media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'post-media', 'university-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      bucket_id <> 'university-media'
      or not exists (
        select 1
        from public.university_photos photo
        where photo.image_path = name
          and photo.status <> 'PENDING'
      )
    )
  )
  with check (
    bucket_id in ('avatars', 'post-media', 'university-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_active_user())
  );

drop policy if exists "members delete their own media" on storage.objects;
create policy "members delete their own media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-media', 'university-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      bucket_id <> 'university-media'
      or not exists (
        select 1
        from public.university_photos photo
        where photo.image_path = name
          and photo.status <> 'PENDING'
      )
    )
  );

drop policy if exists "takka buckets are listable" on storage.buckets;
create policy "takka buckets are listable" on storage.buckets
  for select to anon, authenticated
  using (id in ('avatars', 'post-media', 'university-media'));
