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
```

Only use a publishable key in the frontend. Never place a secret or service-role key in a `VITE_*` variable.

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

## Administration Console

Administration is a separate Java application, not a page inside the student app. Sign in at:

```
http://localhost:8080/admin
```

The console has its own cookie session and CSRF protection, its own sidebar (Overview, Reports, Accounts, Posts, Universities, Catalog, Audit log), and shares no layout, navigation, or styling with the member experience. Signing in requires Supabase credentials that also have an active row in `admin_users`; member credentials are refused with an explanation rather than given a session.

Two roles exist. A `MODERATOR` can work the report queue, block and unblock accounts, and remove or restore posts. A `SUPER_ADMIN` can additionally delete accounts, edit the university directory, publish or archive universities, and curate campuses, departments, and programs. Every action appends an immutable row to `moderation_actions`, visible under Audit log.

Members never see an administration link, and there is no `/admin` route in the React app.

## Language Report

```powershell
pwsh ./scripts/language-report.ps1
```

Prints bytes and lines per language, excluding files marked `linguist-generated` in `.gitattributes`, and exits non-zero if TypeScript ever outgrows Java. Add `-Detailed` to list every counted file.
