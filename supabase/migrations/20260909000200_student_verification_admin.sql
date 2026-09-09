-- Allow student verification decisions to appear in the immutable admin audit trail.
alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check check (action in (
  'BLOCK_USER', 'UNBLOCK_USER', 'DELETE_USER', 'REMOVE_POST', 'RESTORE_POST',
  'RESOLVE_REPORT', 'DISMISS_REPORT', 'CREATE_UNIVERSITY', 'UPDATE_UNIVERSITY',
  'PUBLISH_UNIVERSITY', 'UNPUBLISH_UNIVERSITY', 'ARCHIVE_UNIVERSITY',
  'APPROVE_UNIVERSITY_PHOTO', 'REJECT_UNIVERSITY_PHOTO',
  'APPROVE_OPPORTUNITY', 'REJECT_OPPORTUNITY',
  'VERIFY_STUDENT', 'REJECT_STUDENT_VERIFICATION'
));
