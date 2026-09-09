-- Enum additions must commit before later migrations use the new values.
alter type public.notification_type add value if not exists 'opportunity_deadline';
alter type public.notification_type add value if not exists 'opportunity_status';
alter type public.notification_type add value if not exists 'buddy_request';
alter type public.notification_type add value if not exists 'buddy_accepted';
