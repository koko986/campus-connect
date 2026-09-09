# TAKKA

TAKKA is a university discovery and student community platform for Myanmar. The React application uses Supabase Auth, PostgreSQL, Row Level Security, and Realtime. The Spring Boot service in `backend/` protects reports and hosts the administration console, which is a server-rendered Java application rather than part of the student app.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- Java 21 and Maven

## Environment

Create `.env.local` in the repository root:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
VITE_TAKKA_API_URL=http://localhost:8080
VITE_SUPABASE_PROXY_URL=https://your-deployed-takka-api.example.com/api/supabase
```

Only use a publishable key in the frontend. Never place a secret or service-role key in a `VITE_*` variable.
`VITE_SUPABASE_PROXY_URL` is optional. Set it to the deployed Java endpoint when local networks cannot reach `*.supabase.co`; production automatically uses `VITE_TAKKA_API_URL` when the override is omitted.

Set the Java server credentials in the terminal that starts the backend:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
$env:SUPABASE_SECRET_KEY="sb_secret_your_server_key"
```

Find the secret key in Supabase Dashboard under **Project Settings > API Keys**. Never put it in `.env.local`, a `VITE_*` variable, Git, or browser code.

## Run

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm install
npm run dev
```

In a second terminal:

```powershell
npm run dev:backend
```

Open `http://127.0.0.1:5173`. Build for production with `npm run build`.

## Authentication And Data

TAKKA uses Supabase email/password authentication. Registration creates either a current-student profile with university details or a prospective-student profile with study preferences. The current project accepts the configured demo emails without a confirmation step.

The frontend reads and writes live Supabase tables. There is no mock-data fallback. Empty tables produce explicit empty states. Main capabilities include universities and departments, saved universities, posts and likes, questions and tags, profiles, RLS-protected conversations, persisted messages, and realtime message refresh.

Generated database types live in `src/lib/database.types.ts`. Regenerate them after schema changes.

Apply every SQL file in `supabase/migrations/` in filename order before deploying a frontend that
uses the corresponding feature. The Student Hub requires both `20260909000000` and
`20260909000100`; student verification decisions also require `20260909000200`.

## Production Checklist

- Configure the production Site URL and redirect URLs in Supabase Auth.
- Configure custom SMTP for confirmation and password-reset email.
- Keep email confirmation enabled.
- Review Supabase Security and Performance advisors.
- Enable leaked-password protection in Supabase Auth before public launch.
- Enable backups, monitoring, and abuse controls appropriate to the deployment.

## Java Moderation Backend

```powershell
cd backend
mvn spring-boot:run
```

The community can read public Supabase data without Java, but reporting and the administration console require this service. Supabase user access tokens are validated server-side; the secret key is used only for administrator operations.

The backend also exposes the member app at its root as a network fallback for regions where
`*.vercel.app` is unreachable. It relays only known frontend GET/HEAD routes from
`TAKKA_FRONTEND_UPSTREAM`; `/api/**` and `/admin/**` continue to be handled locally.

## Administration Console

Administration is a separate Java application, not a page inside the student app. Sign in at:

```
http://localhost:8080/admin
```

The console has its own cookie session and CSRF protection, its own sidebar (Overview, Reports, Accounts, Posts, Universities, Catalog, Audit log), and shares no layout, navigation, or styling with the member experience. Signing in requires Supabase credentials that also have an active row in `admin_users`; member credentials are refused with an explanation rather than given a session.

Two roles exist. A `MODERATOR` can work the report queue, block and unblock accounts, and remove or restore posts. A `SUPER_ADMIN` can additionally delete accounts, edit the university directory, publish or archive universities, and curate campuses, departments, and programs. Every action appends an immutable row to `moderation_actions`, visible under Audit log.

Members never see an administration link, and there is no `/admin` route in the React app.

### Create The First Administrator

No shared administrator password is committed to the project. Create a normal Supabase Auth account
with an email address you control, then promote it once from the Supabase SQL editor:

```sql
insert into public.admin_users (user_id, role, is_active)
select id, 'SUPER_ADMIN', true
from auth.users
where lower(email) = lower('your-email@gmail.com')
on conflict (user_id) do update
set role = excluded.role, is_active = true, updated_at = now();
```

Use that account's email and password at the deployed Java backend's `/admin/login` URL. Never add
an administrator password to Git, a migration, or a frontend environment variable.

## Language Report

```powershell
pwsh ./scripts/language-report.ps1
```

Prints bytes and lines per language, excluding files marked `linguist-generated` in `.gitattributes`, and exits non-zero if TypeScript ever outgrows Java. Add `-Detailed` to list every counted file.
