-- University photo decisions are moderation actions and belong in the same
-- append-only audit trail as account, post, report, and directory decisions.

alter table public.moderation_actions
  drop constraint if exists moderation_actions_action_check;

alter table public.moderation_actions
  add constraint moderation_actions_action_check
  check (action in (
    'BLOCK_USER', 'UNBLOCK_USER', 'DELETE_USER',
    'REMOVE_POST', 'RESTORE_POST',
    'RESOLVE_REPORT', 'DISMISS_REPORT',
    'CREATE_UNIVERSITY', 'UPDATE_UNIVERSITY', 'PUBLISH_UNIVERSITY',
    'UNPUBLISH_UNIVERSITY', 'ARCHIVE_UNIVERSITY',
    'APPROVE_UNIVERSITY_PHOTO', 'REJECT_UNIVERSITY_PHOTO'
  ));
