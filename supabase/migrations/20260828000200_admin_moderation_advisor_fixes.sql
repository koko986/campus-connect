do $$
declare
  table_name text;
begin
  foreach table_name in array array['admin_users', 'account_moderation', 'reports', 'moderation_actions']
  loop
    execute format(
      'create policy "browser access denied" on public.%I for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;

create index account_moderation_blocked_by_idx on public.account_moderation (blocked_by) where blocked_by is not null;
create index moderation_actions_report_id_idx on public.moderation_actions (report_id) where report_id is not null;
create index posts_removed_by_idx on public.posts (removed_by) where removed_by is not null;
create index reports_assigned_to_idx on public.reports (assigned_to) where assigned_to is not null;
create index universities_archived_by_idx on public.universities (archived_by) where archived_by is not null;
