-- Admin accounts are separate from member accounts. This migration makes the
-- requested demo admin account a super admin once its TAKKA profile exists, and
-- sends notification rows to active administrators when new review work arrives.

insert into public.admin_users (user_id, role, is_active)
select p.id, 'SUPER_ADMIN', true
from public.profiles p
where lower(p.email) = 'admin@gmail.com'
on conflict (user_id) do update
set role = 'SUPER_ADMIN',
    is_active = true,
    updated_at = now();

create or replace function private.notify_active_admins(
  p_actor_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    user_id, actor_id, notification_type, entity_type, entity_id, body
  )
  select
    admin.user_id,
    p_actor_id,
    'system',
    p_entity_type,
    p_entity_id,
    left(coalesce(nullif(trim(p_body), ''), 'New admin review item.'), 200)
  from public.admin_users admin
  where admin.is_active
    and (p_actor_id is null or admin.user_id <> p_actor_id);
end;
$$;

revoke all on function private.notify_active_admins(uuid, text, uuid, text)
  from public, anon, authenticated;

create or replace function private.notify_admin_report_queue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_active_admins(
    new.reporter_id,
    'report',
    new.id,
    'New ' || lower(new.target_type) || ' report awaiting review: ' || new.reason
  );
  return new;
end;
$$;

revoke all on function private.notify_admin_report_queue() from public, anon, authenticated;

drop trigger if exists notify_admin_report_queue on public.reports;
create trigger notify_admin_report_queue
after insert on public.reports
for each row execute function private.notify_admin_report_queue();

create or replace function private.notify_admin_opportunity_queue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' then
    perform private.notify_active_admins(
      new.created_by,
      'opportunity',
      new.id,
      'New opportunity awaiting review: ' || new.title
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_admin_opportunity_queue()
  from public, anon, authenticated;

drop trigger if exists notify_admin_opportunity_queue on public.opportunities;
create trigger notify_admin_opportunity_queue
after insert on public.opportunities
for each row execute function private.notify_admin_opportunity_queue();

create or replace function private.notify_admin_student_verification_queue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.verification_status = 'pending'
    and (tg_op = 'INSERT' or old.verification_status is distinct from new.verification_status)
  then
    perform private.notify_active_admins(
      new.user_id,
      'student_verification',
      new.user_id,
      'Student verification awaiting review.'
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_admin_student_verification_queue()
  from public, anon, authenticated;

drop trigger if exists notify_admin_student_verification_queue on public.student_profiles;
create trigger notify_admin_student_verification_queue
after insert or update of verification_status on public.student_profiles
for each row execute function private.notify_admin_student_verification_queue();

create or replace function private.notify_admin_university_photo_queue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'PENDING' then
    perform private.notify_active_admins(
      new.uploader_id,
      'university_photo',
      new.id,
      'New campus photo awaiting review.'
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_admin_university_photo_queue()
  from public, anon, authenticated;

drop trigger if exists notify_admin_university_photo_queue on public.university_photos;
create trigger notify_admin_university_photo_queue
after insert on public.university_photos
for each row execute function private.notify_admin_university_photo_queue();
