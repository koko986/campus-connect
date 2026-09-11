-- Cover Student Hub foreign keys used by joins, moderation queues, and deletes.
create index if not exists opportunities_reviewed_by_idx
  on public.opportunities (reviewed_by);

create index if not exists opportunities_university_idx
  on public.opportunities (university_id);

create index if not exists opportunity_reminders_opportunity_idx
  on public.opportunity_reminders (opportunity_id);

create index if not exists study_buddy_dismissals_dismissed_user_idx
  on public.study_buddy_dismissals (dismissed_user_id);
