-- TAKKA mobile community expansion.
--
-- Adds community/profile-only post scopes, threaded comments with upvotes,
-- saved posts, soft deletion, university group chats, realtime replication,
-- media storage buckets and privacy-safe member profile reads.
--
-- Every statement is written to be re-runnable against an already migrated
-- database so the file can be replayed on a fresh project.

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'post_scope'
  ) then
    create type public.post_scope as enum ('COMMUNITY', 'PROFILE_ONLY');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'conversation_type'
  ) then
    create type public.conversation_type as enum ('DIRECT', 'UNIVERSITY_GROUP');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Posts: scope, soft deletion, denormalised counters
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists scope public.post_scope not null default 'COMMUNITY',
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

-- Posts written before scopes existed only belong on the author profile when
-- they carry no university tag.
update public.posts
set scope = 'PROFILE_ONLY'
where university_id is null and scope = 'COMMUNITY';

alter table public.posts drop constraint if exists posts_community_requires_university;
alter table public.posts
  add constraint posts_community_requires_university
  check (scope <> 'COMMUNITY' or university_id is not null);

-- ---------------------------------------------------------------------------
-- Comments: threading, soft deletion, counters
-- ---------------------------------------------------------------------------

alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade,
  add column if not exists deleted_at timestamptz,
  add column if not exists vote_count integer not null default 0,
  add column if not exists reply_count integer not null default 0;

-- ---------------------------------------------------------------------------
-- Comment upvotes and saved posts
-- ---------------------------------------------------------------------------

create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.comment_votes enable row level security;
alter table public.saved_posts enable row level security;

grant select, insert, delete on public.comment_votes to authenticated;
grant select, insert, delete on public.saved_posts to authenticated;
grant all on public.comment_votes to service_role;
grant all on public.saved_posts to service_role;

-- ---------------------------------------------------------------------------
-- Conversations: direct messages and one discoverable group per university
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column if not exists conversation_type public.conversation_type not null default 'DIRECT',
  add column if not exists university_id uuid references public.universities(id) on delete cascade,
  add column if not exists title text,
  add column if not exists member_count integer not null default 0;

alter table public.conversations drop constraint if exists conversations_group_requires_university;
alter table public.conversations
  add constraint conversations_group_requires_university
  check (
    (conversation_type = 'DIRECT' and university_id is null)
    or (conversation_type = 'UNIVERSITY_GROUP' and university_id is not null)
  );

create unique index if not exists conversations_one_group_per_university
  on public.conversations (university_id)
  where conversation_type = 'UNIVERSITY_GROUP';

-- ---------------------------------------------------------------------------
-- Counter maintenance
--
-- The trigger functions recount from source rather than applying deltas so a
-- replay of this migration repairs any drift. They are security definer
-- because a member liking or replying is not allowed to update the row that
-- holds the counter.
-- ---------------------------------------------------------------------------

create or replace function private.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := case when tg_op = 'DELETE' then old.post_id else new.post_id end;
begin
  update public.posts
  set like_count = (select count(*) from public.post_likes pl where pl.post_id = target)
  where id = target;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.sync_comment_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post uuid;
  target_parent uuid;
begin
  if tg_op = 'DELETE' then
    target_post := old.post_id;
    target_parent := old.parent_comment_id;
  else
    target_post := new.post_id;
    target_parent := new.parent_comment_id;
  end if;

  update public.posts
  set comment_count = (
    select count(*) from public.comments c
    where c.post_id = target_post and c.deleted_at is null
  )
  where id = target_post;

  if target_parent is not null then
    update public.comments
    set reply_count = (
      select count(*) from public.comments c
      where c.parent_comment_id = target_parent and c.deleted_at is null
    )
    where id = target_parent;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.sync_comment_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := case when tg_op = 'DELETE' then old.comment_id else new.comment_id end;
begin
  update public.comments
  set vote_count = (select count(*) from public.comment_votes v where v.comment_id = target)
  where id = target;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.sync_conversation_member_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := case when tg_op = 'DELETE' then old.conversation_id else new.conversation_id end;
begin
  update public.conversations
  set member_count = (
    select count(*) from public.conversation_members m where m.conversation_id = target
  )
  where id = target;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.validate_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_post uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;
  if new.parent_comment_id = new.id then
    raise exception 'A reply cannot point at itself';
  end if;

  select c.post_id into parent_post
  from public.comments c
  where c.id = new.parent_comment_id;

  if parent_post is null then
    raise exception 'The comment being replied to no longer exists';
  end if;
  if parent_post <> new.post_id then
    raise exception 'A reply must stay on the same post';
  end if;
  return new;
end;
$$;

create or replace function private.notify_comment_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if new.parent_comment_id is not null then
    select c.author_id into recipient from public.comments c where c.id = new.parent_comment_id;
  else
    select p.author_id into recipient from public.posts p where p.id = new.post_id;
  end if;

  if recipient is null or recipient = new.author_id then
    return new;
  end if;

  insert into public.notifications (
    user_id, actor_id, notification_type, entity_type, entity_id, body
  ) values (
    recipient,
    new.author_id,
    'comment',
    'post',
    new.post_id,
    left(new.body, 200)
  );
  return new;
end;
$$;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
after insert or delete on public.post_likes
for each row execute function private.sync_post_like_count();

drop trigger if exists comments_validate_parent on public.comments;
create trigger comments_validate_parent
before insert or update of parent_comment_id, post_id on public.comments
for each row execute function private.validate_comment_parent();

drop trigger if exists comments_sync_counters on public.comments;
create trigger comments_sync_counters
after insert or delete on public.comments
for each row execute function private.sync_comment_counters();

-- Restricted to deletion state changes so that writing reply_count back into
-- public.comments cannot re-enter this trigger.
drop trigger if exists comments_sync_counters_on_delete on public.comments;
create trigger comments_sync_counters_on_delete
after update of deleted_at on public.comments
for each row
when (old.deleted_at is distinct from new.deleted_at)
execute function private.sync_comment_counters();

drop trigger if exists comments_notify_reply on public.comments;
create trigger comments_notify_reply
after insert on public.comments
for each row execute function private.notify_comment_reply();

drop trigger if exists comment_votes_sync_count on public.comment_votes;
create trigger comment_votes_sync_count
after insert or delete on public.comment_votes
for each row execute function private.sync_comment_vote_count();

drop trigger if exists conversation_members_sync_count on public.conversation_members;
create trigger conversation_members_sync_count
after insert or delete on public.conversation_members
for each row execute function private.sync_conversation_member_count();

-- Backfill counters for rows created before the triggers existed.
update public.posts p
set like_count = (select count(*) from public.post_likes pl where pl.post_id = p.id),
    comment_count = (
      select count(*) from public.comments c where c.post_id = p.id and c.deleted_at is null
    );

update public.comments c
set vote_count = (select count(*) from public.comment_votes v where v.comment_id = c.id),
    reply_count = (
      select count(*) from public.comments r
      where r.parent_comment_id = c.id and r.deleted_at is null
    );

update public.conversations cv
set member_count = (
  select count(*) from public.conversation_members m where m.conversation_id = cv.id
);

-- ---------------------------------------------------------------------------
-- University group provisioning
-- ---------------------------------------------------------------------------

create or replace function private.ensure_university_group(target_university_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  group_id uuid;
  group_title text;
begin
  select c.id into group_id
  from public.conversations c
  where c.conversation_type = 'UNIVERSITY_GROUP'
    and c.university_id = target_university_id;

  if group_id is not null then
    return group_id;
  end if;

  select u.name into group_title
  from public.universities u
  where u.id = target_university_id
    and u.is_published
    and u.archived_at is null;

  if group_title is null then
    return null;
  end if;

  insert into public.conversations (conversation_type, university_id, title)
  values ('UNIVERSITY_GROUP', target_university_id, group_title)
  on conflict (university_id) where conversation_type = 'UNIVERSITY_GROUP' do nothing
  returning id into group_id;

  if group_id is null then
    select c.id into group_id
    from public.conversations c
    where c.conversation_type = 'UNIVERSITY_GROUP'
      and c.university_id = target_university_id;
  end if;

  return group_id;
end;
$$;

grant execute on function private.ensure_university_group(uuid) to authenticated;

create or replace function private.sync_university_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published and new.archived_at is null then
    perform private.ensure_university_group(new.id);
  end if;

  update public.conversations
  set title = new.name
  where conversation_type = 'UNIVERSITY_GROUP'
    and university_id = new.id
    and title is distinct from new.name;

  return new;
end;
$$;

drop trigger if exists universities_sync_group_chat on public.universities;
create trigger universities_sync_group_chat
after insert or update of is_published, archived_at, name on public.universities
for each row execute function private.sync_university_group();

do $$
declare
  university record;
begin
  for university in
    select id from public.universities where is_published and archived_at is null
  loop
    perform private.ensure_university_group(university.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Callable operations
-- ---------------------------------------------------------------------------

-- These three operations are narrow self service actions, so they authorise the
-- caller in the function body instead of delegating to row level security. Each
-- one can only ever touch the caller's own membership or the caller's own
-- content, and the boolean return lets the browser distinguish "not yours" from
-- "already gone" without reading back a row the select policy now hides.
create or replace function public.soft_delete_post(target_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  affected integer;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_active_user() then
    raise exception 'This account cannot delete posts';
  end if;

  update public.posts
  set deleted_at = now(),
      deleted_by = caller
  where id = target_post_id
    and author_id = caller
    and deleted_at is null
    and moderation_status = 'PUBLISHED';

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

create or replace function public.soft_delete_comment(target_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  affected integer;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_active_user() then
    raise exception 'This account cannot delete comments';
  end if;

  update public.comments
  set deleted_at = now(),
      body = '[deleted]'
  where id = target_comment_id
    and author_id = caller
    and deleted_at is null;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

create or replace function public.join_university_group(target_university_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  group_id uuid;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_active_user() then
    raise exception 'This account cannot join group chats';
  end if;

  group_id := private.ensure_university_group(target_university_id);
  if group_id is null then
    raise exception 'This university group chat is not available';
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (group_id, caller)
  on conflict (conversation_id, user_id) do nothing;

  return group_id;
end;
$$;

revoke execute on function public.soft_delete_post(uuid) from public, anon;
revoke execute on function public.soft_delete_comment(uuid) from public, anon;
revoke execute on function public.join_university_group(uuid) from public, anon;
grant execute on function public.soft_delete_post(uuid) to authenticated;
grant execute on function public.soft_delete_comment(uuid) to authenticated;
grant execute on function public.join_university_group(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

-- Soft deleted posts leave every browser facing view. Moderation removal keeps
-- working through the service role used by the Java gateway.
drop policy if exists "authenticated users read published posts" on public.posts;
drop policy if exists "authenticated users read visible posts" on public.posts;
create policy "authenticated users read visible posts" on public.posts
  for select to authenticated
  using (moderation_status = 'PUBLISHED' and deleted_at is null);

-- Deletion is always soft so administrators and the audit trail keep the row.
drop policy if exists "authors delete posts" on public.posts;
drop policy if exists "authors delete comments" on public.comments;

-- Authors may edit their own post but never reverse a moderator decision.
drop policy if exists "authors cannot change moderation state" on public.posts;
create policy "authors cannot change moderation state" on public.posts
  as restrictive for update to authenticated
  using (moderation_status = 'PUBLISHED')
  with check (
    moderation_status = 'PUBLISHED'
    and removed_at is null
    and removed_by is null
    and removal_reason is null
    and (deleted_by is null or deleted_by = (select auth.uid()))
  );

create or replace function private.post_is_visible(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.id = target_post_id
      and p.moderation_status = 'PUBLISHED'
      and p.deleted_at is null
  );
$$;

grant execute on function private.post_is_visible(uuid) to authenticated;

drop policy if exists "authenticated users read comments" on public.comments;
create policy "authenticated users read comments" on public.comments
  for select to authenticated
  using (private.post_is_visible(post_id));

-- Comment upvotes: readable so a member can see their own vote state, writable
-- only for the voting member. The primary key enforces one vote per member.
drop policy if exists "authenticated users read comment votes" on public.comment_votes;
create policy "authenticated users read comment votes" on public.comment_votes
  for select to authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id));

-- Insert and delete are separate policies so that only one permissive policy
-- ever applies to a select, which the performance advisor checks for.
drop policy if exists "users manage their comment votes" on public.comment_votes;
drop policy if exists "users add their comment votes" on public.comment_votes;
create policy "users add their comment votes" on public.comment_votes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "users remove their comment votes" on public.comment_votes;
create policy "users remove their comment votes" on public.comment_votes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Saved posts stay private to the member who saved them.
drop policy if exists "users manage their saved posts" on public.saved_posts;
create policy "users manage their saved posts" on public.saved_posts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Blocked accounts cannot write, matching every other table.
do $$
declare
  target text;
begin
  foreach target in array array['comment_votes', 'saved_posts']
  loop
    execute format(
      'drop policy if exists "active users insert %1$s" on public.%1$I', target
    );
    execute format(
      'create policy "active users insert %1$s" on public.%1$I as restrictive for insert to authenticated with check ((select private.is_active_user()))',
      target
    );
    execute format(
      'drop policy if exists "active users update %1$s" on public.%1$I', target
    );
    execute format(
      'create policy "active users update %1$s" on public.%1$I as restrictive for update to authenticated using ((select private.is_active_user())) with check ((select private.is_active_user()))',
      target
    );
    execute format(
      'drop policy if exists "active users delete %1$s" on public.%1$I', target
    );
    execute format(
      'create policy "active users delete %1$s" on public.%1$I as restrictive for delete to authenticated using ((select private.is_active_user()))',
      target
    );
  end loop;
end $$;

-- University groups are discoverable by every signed in member so they can
-- join. Direct conversations stay limited to their members. Group discovery is
-- folded into the existing read policy rather than added alongside it so a
-- single permissive policy covers the select.
drop policy if exists "members and creators read conversations" on public.conversations;
drop policy if exists "members discover university groups" on public.conversations;
drop policy if exists "members read reachable conversations" on public.conversations;
create policy "members read reachable conversations" on public.conversations
  for select to authenticated
  using (
    conversation_type = 'UNIVERSITY_GROUP'
    or created_by = (select auth.uid())
    or private.is_conversation_member(id)
  );

drop policy if exists "creators add conversation members" on public.conversation_members;
drop policy if exists "members join university groups" on public.conversation_members;
drop policy if exists "creators invite and members join groups" on public.conversation_members;
create policy "creators invite and members join groups" on public.conversation_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = (select auth.uid())
    )
    or (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.conversations c
        where c.id = conversation_id and c.conversation_type = 'UNIVERSITY_GROUP'
      )
    )
  );

drop policy if exists "members leave conversations" on public.conversation_members;
create policy "members leave conversations" on public.conversation_members
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Privacy safe member profiles
-- ---------------------------------------------------------------------------

-- Email addresses are never part of a member facing profile. A table wide
-- select grant would override a column level revoke, so the broad grant is
-- withdrawn first and only the privacy safe columns are granted back. Signed
-- in members read their own address from the auth session instead.
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, account_type, avatar_path, bio, is_public, created_at, updated_at)
  on public.profiles to authenticated;

-- The profile row is created by the signup trigger from auth.users, so a
-- member never needs write access to the stored address either.
revoke insert (email), update (email), references (email)
  on public.profiles from anon, authenticated;

drop policy if exists "student details readable by authenticated users" on public.student_profiles;
drop policy if exists "member student details are readable" on public.student_profiles;
create policy "member student details are readable" on public.student_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_id and (p.is_public or p.id = (select auth.uid()))
    )
  );

-- Prospective students previously could not be viewed at all. Their study
-- preferences are profile content, so signed in members may read them while
-- the account still controls its own writes.
drop policy if exists "prospective details are private" on public.prospective_profiles;
drop policy if exists "member prospective details are readable" on public.prospective_profiles;
create policy "member prospective details are readable" on public.prospective_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_id and (p.is_public or p.id = (select auth.uid()))
    )
  );

drop policy if exists "prospective students insert their details" on public.prospective_profiles;
create policy "prospective students insert their details" on public.prospective_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "prospective students update their details" on public.prospective_profiles;
create policy "prospective students update their details" on public.prospective_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "prospective students delete their details" on public.prospective_profiles;
create policy "prospective students delete their details" on public.prospective_profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage buckets for avatars and post media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "takka media is readable" on storage.objects;
create policy "takka media is readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('avatars', 'post-media'));

-- Uploads live under a folder named after the owner so ownership is provable
-- from the object path as well as the owner column.
drop policy if exists "members upload their own media" on storage.objects;
create policy "members upload their own media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_active_user())
  );

drop policy if exists "members replace their own media" on storage.objects;
create policy "members replace their own media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_active_user())
  );

drop policy if exists "members delete their own media" on storage.objects;
create policy "members delete their own media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "takka buckets are listable" on storage.buckets;
create policy "takka buckets are listable" on storage.buckets
  for select to anon, authenticated
  using (id in ('avatars', 'post-media'));

-- ---------------------------------------------------------------------------
-- Realtime
--
-- Adding tables to the existing publication keeps the protected realtime
-- schema untouched. Full replica identity lets filtered subscriptions match
-- update and delete events, not just inserts.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
end $$;

alter table public.conversations replica identity full;
alter table public.conversation_members replica identity full;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists posts_scope_feed_idx
  on public.posts (scope, created_at desc) where deleted_at is null;
create index if not exists posts_best_feed_idx
  on public.posts (like_count desc, created_at desc) where deleted_at is null;
create index if not exists posts_author_feed_idx
  on public.posts (author_id, created_at desc);
create index if not exists posts_deleted_by_idx
  on public.posts (deleted_by) where deleted_by is not null;

create index if not exists comments_parent_idx
  on public.comments (parent_comment_id, created_at);
create index if not exists comments_best_idx
  on public.comments (post_id, vote_count desc, created_at);

create index if not exists comment_votes_user_idx on public.comment_votes (user_id);
create index if not exists saved_posts_user_idx on public.saved_posts (user_id, created_at desc);

create index if not exists messages_pagination_idx
  on public.messages (conversation_id, created_at desc, id desc);
create index if not exists conversations_type_idx
  on public.conversations (conversation_type, last_message_at desc);

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

-- public.touch_conversation and private.touch_conversation_after_message did
-- the same work on every insert. Keep the private security definer copy.
drop trigger if exists message_touches_conversation on public.messages;
drop function if exists public.touch_conversation();
