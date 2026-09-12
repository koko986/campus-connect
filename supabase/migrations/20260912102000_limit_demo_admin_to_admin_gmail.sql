-- The presentation/demo build has exactly one administrator account:
-- admin@gmail.com. Any other accidental admin assignment is deactivated so
-- student accounts cannot be routed to the admin handoff screen.

insert into public.admin_users (user_id, role, is_active)
select p.id, 'SUPER_ADMIN', true
from public.profiles p
where lower(p.email) = 'admin@gmail.com'
on conflict (user_id) do update
set role = 'SUPER_ADMIN',
    is_active = true,
    updated_at = now();

update public.admin_users admin
set is_active = false,
    updated_at = now()
from public.profiles p
where p.id = admin.user_id
  and lower(p.email) <> 'admin@gmail.com';
