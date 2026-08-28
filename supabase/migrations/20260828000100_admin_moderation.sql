create schema if not exists private;

create table public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN', 'MODERATOR')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_moderation (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'BLOCKED')),
  reason text,
  blocked_at timestamptz,
  blocked_by uuid references public.admin_users(user_id) on delete set null,
  updated_at timestamptz not null default now(),
  check ((status = 'ACTIVE' and blocked_at is null) or (status = 'BLOCKED' and blocked_at is not null))
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('ACCOUNT', 'POST')),
  target_id uuid not null,
  reason text not null check (reason in ('SPAM', 'HARASSMENT', 'IMPERSONATION', 'MISINFORMATION', 'INAPPROPRIATE', 'OTHER')),
  details text check (details is null or char_length(details) between 10 and 2000),
  status text not null default 'OPEN' check (status in ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
  assigned_to uuid references public.admin_users(user_id) on delete set null,
  resolution_notes text check (resolution_notes is null or char_length(resolution_notes) <= 2000),
  target_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  admin_email text not null,
  action text not null check (action in (
    'BLOCK_USER', 'UNBLOCK_USER', 'DELETE_USER',
    'REMOVE_POST', 'RESTORE_POST',
    'RESOLVE_REPORT', 'DISMISS_REPORT',
    'CREATE_UNIVERSITY', 'UPDATE_UNIVERSITY', 'PUBLISH_UNIVERSITY',
    'UNPUBLISH_UNIVERSITY', 'ARCHIVE_UNIVERSITY'
  )),
  target_type text not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 2000),
  report_id uuid references public.reports(id) on delete set null,
  target_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.posts
  add column moderation_status text not null default 'PUBLISHED'
    check (moderation_status in ('PUBLISHED', 'REMOVED', 'ARCHIVED')),
  add column removed_at timestamptz,
  add column removed_by uuid references public.admin_users(user_id) on delete set null,
  add column removal_reason text;

alter table public.universities
  add column archived_at timestamptz,
  add column archived_by uuid references public.admin_users(user_id) on delete set null;

alter table public.answers alter column author_id drop not null;
alter table public.comments alter column author_id drop not null;
alter table public.posts alter column author_id drop not null;
alter table public.questions alter column author_id drop not null;
alter table public.messages alter column sender_id drop not null;
alter table public.conversations alter column created_by drop not null;

alter table public.answers drop constraint answers_author_id_fkey;
alter table public.answers add constraint answers_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.comments drop constraint comments_author_id_fkey;
alter table public.comments add constraint comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.posts drop constraint posts_author_id_fkey;
alter table public.posts add constraint posts_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.questions drop constraint questions_author_id_fkey;
alter table public.questions add constraint questions_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.messages drop constraint messages_sender_id_fkey;
alter table public.messages add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;
alter table public.conversations drop constraint conversations_created_by_fkey;
alter table public.conversations add constraint conversations_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

create index reports_queue_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);
create unique index reports_one_active_per_target_idx
  on public.reports (reporter_id, target_type, target_id)
  where status in ('OPEN', 'REVIEWING');
create index account_moderation_status_idx on public.account_moderation (status, updated_at desc);
create index moderation_actions_created_idx on public.moderation_actions (created_at desc);
create index posts_moderation_idx on public.posts (moderation_status, created_at desc);
create index universities_archive_idx on public.universities (archived_at) where archived_at is not null;

alter table public.admin_users enable row level security;
alter table public.account_moderation enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

revoke all on public.admin_users, public.account_moderation, public.reports, public.moderation_actions from anon, authenticated;
grant all on public.admin_users, public.account_moderation, public.reports, public.moderation_actions to service_role;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.account_moderation m on m.user_id = p.id
    where p.id = (select auth.uid())
      and coalesce(m.status, 'ACTIVE') = 'ACTIVE'
  );
$$;

revoke all on function private.is_active_user() from public, anon;
grant execute on function private.is_active_user() to authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'student_profiles', 'prospective_profiles', 'posts', 'post_likes',
    'comments', 'questions', 'question_tags', 'answers', 'answer_votes',
    'conversations', 'conversation_members', 'messages', 'saved_universities', 'notifications'
  ]
  loop
    execute format(
      'create policy "active users insert %1$s" on public.%1$I as restrictive for insert to authenticated with check ((select private.is_active_user()))',
      table_name
    );
    execute format(
      'create policy "active users update %1$s" on public.%1$I as restrictive for update to authenticated using ((select private.is_active_user())) with check ((select private.is_active_user()))',
      table_name
    );
    execute format(
      'create policy "active users delete %1$s" on public.%1$I as restrictive for delete to authenticated using ((select private.is_active_user()))',
      table_name
    );
  end loop;
end $$;

drop policy "authenticated users read posts" on public.posts;
create policy "authenticated users read published posts"
on public.posts for select to authenticated
using (moderation_status = 'PUBLISHED');

drop policy "published universities are readable" on public.universities;
create policy "published universities are readable"
on public.universities for select to anon, authenticated
using (is_published and archived_at is null);

create or replace function private.prevent_moderation_action_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'moderation audit records are immutable';
end;
$$;

create trigger moderation_actions_immutable
before update or delete on public.moderation_actions
for each row execute function private.prevent_moderation_action_changes();

comment on table public.admin_users is 'Server-managed TAKKA administrator assignments.';
comment on table public.reports is 'User reports submitted through the authenticated Java API.';
comment on table public.moderation_actions is 'Immutable moderation audit trail.';
