-- Complete the browser-facing Q&A and notification contracts.

alter table public.answers
  add column if not exists vote_count integer not null default 0;

create unique index if not exists answers_one_accepted_per_question
  on public.answers (question_id)
  where is_accepted;

create or replace function private.sync_answer_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_answer_id uuid := coalesce(new.answer_id, old.answer_id);
begin
  update public.answers
  set vote_count = (
    select count(*) from public.answer_votes v where v.answer_id = target_answer_id
  )
  where id = target_answer_id;
  return coalesce(new, old);
end;
$$;

create or replace function private.notify_new_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  select q.author_id into recipient
  from public.questions q
  where q.id = new.question_id;

  if recipient is null or recipient = new.author_id then
    return new;
  end if;

  insert into public.notifications (
    user_id, actor_id, notification_type, entity_type, entity_id, body
  ) values (
    recipient, new.author_id, 'answer', 'question', new.question_id, left(new.body, 200)
  );
  return new;
end;
$$;

create or replace function private.notify_answer_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  target_question_id uuid;
begin
  select a.author_id, a.question_id into recipient, target_question_id
  from public.answers a
  where a.id = new.answer_id;

  if recipient is null or recipient = new.user_id then
    return new;
  end if;

  insert into public.notifications (
    user_id, actor_id, notification_type, entity_type, entity_id, body
  ) values (
    recipient, new.user_id, 'helpful_vote', 'question', target_question_id,
    'Someone found your answer helpful.'
  );
  return new;
end;
$$;

create or replace function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    user_id, actor_id, notification_type, entity_type, entity_id, body
  )
  select
    member.user_id, new.sender_id, 'message', 'conversation', new.conversation_id,
    left(new.body, 200)
  from public.conversation_members member
  where member.conversation_id = new.conversation_id
    and member.user_id <> new.sender_id;
  return new;
end;
$$;

drop trigger if exists answer_votes_sync_count on public.answer_votes;
create trigger answer_votes_sync_count
after insert or delete on public.answer_votes
for each row execute function private.sync_answer_vote_count();

drop trigger if exists answers_notify_author on public.answers;
create trigger answers_notify_author
after insert on public.answers
for each row execute function private.notify_new_answer();

drop trigger if exists answer_votes_notify_author on public.answer_votes;
create trigger answer_votes_notify_author
after insert on public.answer_votes
for each row execute function private.notify_answer_vote();

drop trigger if exists messages_notify_members on public.messages;
create trigger messages_notify_members
after insert on public.messages
for each row execute function private.notify_new_message();

update public.answers a
set vote_count = (select count(*) from public.answer_votes v where v.answer_id = a.id);

create or replace function public.set_accepted_answer(target_answer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target_question_id uuid;
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_active_user() then
    raise exception 'This account cannot accept answers';
  end if;

  select a.question_id into target_question_id
  from public.answers a
  join public.questions q on q.id = a.question_id
  where a.id = target_answer_id
    and q.author_id = caller;

  if target_question_id is null then
    return false;
  end if;

  update public.answers
  set is_accepted = (id = target_answer_id)
  where question_id = target_question_id;
  return true;
end;
$$;

revoke execute on function public.set_accepted_answer(uuid) from public, anon;
grant execute on function public.set_accepted_answer(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
