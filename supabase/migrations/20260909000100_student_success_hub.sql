-- TAKKA Student Success Hub: decision tools, moderated opportunities and
-- consent-based study buddy matching.

alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check check (action in (
  'BLOCK_USER', 'UNBLOCK_USER', 'DELETE_USER', 'REMOVE_POST', 'RESTORE_POST',
  'RESOLVE_REPORT', 'DISMISS_REPORT', 'CREATE_UNIVERSITY', 'UPDATE_UNIVERSITY',
  'PUBLISH_UNIVERSITY', 'UNPUBLISH_UNIVERSITY', 'ARCHIVE_UNIVERSITY',
  'APPROVE_UNIVERSITY_PHOTO', 'REJECT_UNIVERSITY_PHOTO',
  'APPROVE_OPPORTUNITY', 'REJECT_OPPORTUNITY'
));

create table public.matcher_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_field text,
  preferred_city text,
  preferred_degree_level text,
  preferred_university_type public.university_type,
  field_weight smallint not null default 3 check (field_weight between 1 and 5),
  city_weight smallint not null default 2 check (city_weight between 1 and 5),
  degree_weight smallint not null default 3 check (degree_weight between 1 and 5),
  type_weight smallint not null default 1 check (type_weight between 1 and 5),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 5 and 140),
  organization text not null check (char_length(trim(organization)) between 2 and 120),
  opportunity_type text not null check (opportunity_type in ('scholarship','internship','competition','workshop','event')),
  description text not null check (char_length(trim(description)) between 30 and 5000),
  eligibility text,
  location text,
  external_url text check (external_url is null or external_url ~ '^https?://'),
  university_id uuid references public.universities(id) on delete set null,
  starts_at timestamptz,
  deadline_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','published','rejected','closed','archived')),
  review_note text,
  reviewed_by uuid references public.admin_users(user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or starts_at <= deadline_at)
);

create table public.opportunity_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table public.opportunity_reminders (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  reminder_window text not null check (reminder_window in ('seven_days','one_day')),
  delivered_at timestamptz not null default now(),
  primary key (user_id, opportunity_id, reminder_window)
);

create table public.study_buddy_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  topics text[] not null default '{}',
  goals text not null default '' check (char_length(goals) <= 500),
  study_modes text[] not null default '{online}',
  languages text[] not null default '{}',
  availability text[] not null default '{}',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  check (cardinality(topics) between 1 and 8),
  check (study_modes <@ array['online','in_person']::text[]),
  check (cardinality(study_modes) > 0)
);

create table public.study_buddy_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text check (message is null or char_length(message) <= 300),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);

create table public.study_buddy_dismissals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dismissed_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dismissed_user_id),
  check (user_id <> dismissed_user_id)
);

create unique index study_buddy_one_pending_pair_idx
  on public.study_buddy_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';
create index opportunities_public_deadline_idx on public.opportunities (deadline_at, opportunity_type) where status = 'published';
create index opportunities_creator_idx on public.opportunities (created_by, created_at desc);
create index opportunity_bookmarks_opportunity_idx on public.opportunity_bookmarks (opportunity_id);
create index opportunity_reminders_user_idx on public.opportunity_reminders (user_id, delivered_at desc);
create index study_buddy_requests_receiver_idx on public.study_buddy_requests (receiver_id, created_at desc);
create index study_buddy_requests_sender_idx on public.study_buddy_requests (sender_id, created_at desc);

alter table public.matcher_preferences enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_bookmarks enable row level security;
alter table public.opportunity_reminders enable row level security;
alter table public.study_buddy_profiles enable row level security;
alter table public.study_buddy_requests enable row level security;
alter table public.study_buddy_dismissals enable row level security;

create schema if not exists private;

create or replace function private.buddy_pair_is_blocked(first_user uuid, second_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.study_buddy_requests r
    where r.status = 'blocked'
      and ((r.sender_id = first_user and r.receiver_id = second_user)
        or (r.sender_id = second_user and r.receiver_id = first_user))
  );
$$;
revoke all on function private.buddy_pair_is_blocked(uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.buddy_pair_is_blocked(uuid, uuid) to authenticated;

revoke all on public.matcher_preferences, public.opportunities, public.opportunity_bookmarks,
  public.opportunity_reminders, public.study_buddy_profiles, public.study_buddy_requests,
  public.study_buddy_dismissals from anon, authenticated;
grant select, insert, update, delete on public.matcher_preferences to authenticated;
grant select, insert on public.opportunities to authenticated;
grant select, insert, delete on public.opportunity_bookmarks to authenticated;
grant select on public.opportunity_reminders to authenticated;
grant select, insert, update, delete on public.study_buddy_profiles to authenticated;
grant select, insert on public.study_buddy_requests to authenticated;
grant update (status, responded_at) on public.study_buddy_requests to authenticated;
grant select, insert, delete on public.study_buddy_dismissals to authenticated;

create policy "members manage matcher preferences" on public.matcher_preferences
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "members read published and own opportunities" on public.opportunities
  for select to authenticated using (status = 'published' or created_by = (select auth.uid()));
create policy "members submit pending opportunities" on public.opportunities
  for insert to authenticated with check (
    created_by = (select auth.uid()) and status = 'pending' and reviewed_by is null
    and reviewed_at is null and deadline_at > now()
  );

create policy "members read own opportunity bookmarks" on public.opportunity_bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "members create own opportunity bookmarks" on public.opportunity_bookmarks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members delete own opportunity bookmarks" on public.opportunity_bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy "members read own opportunity reminders" on public.opportunity_reminders
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "eligible members discover active study profiles" on public.study_buddy_profiles
  for select to authenticated using (
    user_id = (select auth.uid()) or (
      is_active and exists (
        select 1 from public.profiles p join public.student_profiles s on s.user_id = p.id
        where p.id = study_buddy_profiles.user_id and p.is_public and s.verification_status = 'verified'
      ) and exists (
        select 1 from public.student_profiles mine
        where mine.user_id = (select auth.uid()) and mine.verification_status = 'verified'
      )
    )
  );
create policy "verified students create study profiles" on public.study_buddy_profiles
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.profiles p join public.student_profiles s on s.user_id = p.id
      where p.id = (select auth.uid()) and p.is_public and s.verification_status = 'verified'
    )
  );
create policy "members update own study profile" on public.study_buddy_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members delete own study profile" on public.study_buddy_profiles
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "participants read buddy requests" on public.study_buddy_requests
  for select to authenticated using ((select auth.uid()) in (sender_id, receiver_id));
create policy "verified students send buddy requests" on public.study_buddy_requests
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.study_buddy_profiles mine where mine.user_id = (select auth.uid()) and mine.is_active)
    and exists (select 1 from public.study_buddy_profiles target where target.user_id = receiver_id and target.is_active)
    and not private.buddy_pair_is_blocked(sender_id, receiver_id)
  );
create policy "participants update buddy requests" on public.study_buddy_requests
  for update to authenticated using (
    status = 'pending' and (select auth.uid()) in (sender_id, receiver_id)
  ) with check (
    (sender_id = (select auth.uid()) and status = 'cancelled')
    or (receiver_id = (select auth.uid()) and status in ('accepted','declined','blocked'))
  );

create policy "members read own dismissals" on public.study_buddy_dismissals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "members create own dismissals" on public.study_buddy_dismissals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members delete own dismissals" on public.study_buddy_dismissals
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.recommend_universities_v2(
  p_preferred_field text default null,
  p_preferred_city text default null,
  p_preferred_degree_level text default null,
  p_preferred_university_type public.university_type default null,
  p_field_weight integer default 3,
  p_city_weight integer default 2,
  p_degree_weight integer default 3,
  p_type_weight integer default 1,
  p_limit integer default 12
)
returns table (
  university_id uuid, score integer, field_score integer, city_score integer,
  degree_score integer, type_score integer, match_reasons text[]
)
language sql stable security invoker set search_path = '' as $$
  with scored as (
    select u.id,
      case when nullif(trim(p_preferred_field), '') is not null and exists (
        select 1 from public.departments d where d.university_id = u.id
          and lower(d.name) operator(extensions.%) lower(p_preferred_field)
        union all select 1 from public.programs pr where pr.university_id = u.id
          and lower(pr.name) operator(extensions.%) lower(p_preferred_field)
      ) then greatest(1, least(p_field_weight, 5)) else 0 end as fs,
      case when nullif(trim(p_preferred_city), '') is not null and
        (lower(u.city) operator(extensions.%) lower(p_preferred_city)
          or lower(coalesce(u.region,'')) operator(extensions.%) lower(p_preferred_city))
        then greatest(1, least(p_city_weight, 5)) else 0 end as cs,
      case when nullif(trim(p_preferred_degree_level), '') is not null and exists (
        select 1 from public.programs pr where pr.university_id = u.id
        and lower(coalesce(pr.degree_level,'')) = lower(p_preferred_degree_level)
      ) then greatest(1, least(p_degree_weight, 5)) else 0 end as ds,
      case when p_preferred_university_type is not null and u.university_type = p_preferred_university_type
        then greatest(1, least(p_type_weight, 5)) else 0 end as ts
    from public.universities u where u.is_published and u.archived_at is null
  ), totals as (
    select *, fs + cs + ds + ts as total,
      greatest(1,
        case when nullif(trim(p_preferred_field), '') is not null then greatest(1, least(p_field_weight,5)) else 0 end +
        case when nullif(trim(p_preferred_city), '') is not null then greatest(1, least(p_city_weight,5)) else 0 end +
        case when nullif(trim(p_preferred_degree_level), '') is not null then greatest(1, least(p_degree_weight,5)) else 0 end +
        case when p_preferred_university_type is not null then greatest(1, least(p_type_weight,5)) else 0 end
      ) as possible
    from scored
  )
  select id, round(total::numeric / possible * 100)::integer,
    round(fs::numeric / possible * 100)::integer, round(cs::numeric / possible * 100)::integer,
    round(ds::numeric / possible * 100)::integer, round(ts::numeric / possible * 100)::integer,
    array_remove(array[
      case when fs > 0 then 'field' end, case when cs > 0 then 'city' end,
      case when ds > 0 then 'degree' end, case when ts > 0 then 'type' end
    ], null)
  from totals where total > 0 order by total desc, id limit greatest(1, least(coalesce(p_limit,12),30));
$$;

revoke all on function public.recommend_universities_v2(text,text,text,public.university_type,integer,integer,integer,integer,integer) from public, anon;
grant execute on function public.recommend_universities_v2(text,text,text,public.university_type,integer,integer,integer,integer,integer) to authenticated;

create or replace function private.deliver_due_opportunity_reminders(target_user uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare inserted_count integer;
begin
  if target_user is null or target_user <> (select auth.uid()) then
    raise exception 'Not authorized';
  end if;
  with due as (
    select b.user_id, o.id opportunity_id,
      case when o.deadline_at <= now() + interval '1 day' then 'one_day' else 'seven_days' end window_name,
      o.title
    from public.opportunity_bookmarks b join public.opportunities o on o.id = b.opportunity_id
    where b.user_id = target_user and o.status = 'published' and o.deadline_at > now()
      and o.deadline_at <= now() + interval '7 days'
  ), claimed as (
    insert into public.opportunity_reminders(user_id, opportunity_id, reminder_window)
    select user_id, opportunity_id, window_name from due on conflict do nothing
    returning user_id, opportunity_id, reminder_window
  )
  insert into public.notifications(user_id, actor_id, notification_type, entity_type, entity_id, body)
  select c.user_id, null, 'opportunity_deadline', 'opportunity', c.opportunity_id,
    case when c.reminder_window = 'one_day' then 'Deadline is within 24 hours.' else 'Deadline is within 7 days.' end
  from claimed c;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function private.deliver_due_opportunity_reminders(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.deliver_due_opportunity_reminders(uuid) to authenticated;

create or replace function public.deliver_due_opportunity_reminders()
returns integer language sql security invoker set search_path = '' as $$
  select private.deliver_due_opportunity_reminders((select auth.uid()));
$$;
revoke all on function public.deliver_due_opportunity_reminders() from public, anon;
grant execute on function public.deliver_due_opportunity_reminders() to authenticated;

create or replace function public.notify_hub_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'study_buddy_requests' then
    if tg_op = 'INSERT' then
      insert into public.notifications(user_id, actor_id, notification_type, entity_type, entity_id, body)
      values (new.receiver_id, new.sender_id, 'buddy_request', 'buddy_request', new.id, left(coalesce(new.message,'New study buddy request.'),200));
    elsif old.status = 'pending' and new.status = 'accepted' then
      insert into public.notifications(user_id, actor_id, notification_type, entity_type, entity_id, body)
      values (new.sender_id, new.receiver_id, 'buddy_accepted', 'buddy_request', new.id, 'Your study buddy request was accepted.');
    end if;
  elsif tg_table_name = 'opportunities' and old.status = 'pending' and new.status in ('published','rejected') and new.created_by is not null then
    insert into public.notifications(user_id, actor_id, notification_type, entity_type, entity_id, body)
    values (new.created_by, new.reviewed_by, 'opportunity_status', 'opportunity', new.id,
      case when new.status = 'published' then 'Your opportunity was approved.' else coalesce(nullif(new.review_note,''),'Your opportunity was not approved.') end);
  end if;
  return new;
end;
$$;
revoke all on function public.notify_hub_changes() from public, anon, authenticated;

create trigger notify_buddy_request_changes after insert or update of status on public.study_buddy_requests
  for each row execute function public.notify_hub_changes();
create trigger notify_opportunity_review after update of status on public.opportunities
  for each row execute function public.notify_hub_changes();

alter publication supabase_realtime add table public.study_buddy_requests;
