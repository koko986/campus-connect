-- Covers the reviewer foreign key for admin deletion and join operations.
create index if not exists university_photos_reviewed_by_idx
  on public.university_photos (reviewed_by)
  where reviewed_by is not null;
