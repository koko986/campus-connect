-- Once a submitted photo is approved or rejected it is a moderation record and
-- must not be replaceable or removable by its uploader. Orphaned uploads and
-- pending submissions remain mutable so a failed insert can clean up its file.

drop policy if exists "uploaders withdraw university photos" on public.university_photos;
create policy "uploaders withdraw university photos" on public.university_photos
  for delete to authenticated
  using (
    uploader_id = (select auth.uid())
    and status = 'PENDING'
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
