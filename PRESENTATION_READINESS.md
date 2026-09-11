# TAKKA Presentation Readiness

> Final technical review completed on September 11, 2026.

## Recommended Project Description

TAKKA is a **Java Spring Boot full-stack university discovery and student community platform**. The Java application owns the administration console, security chains, Supabase gateway, authenticated APIs, moderation services, repositories, validation, internationalization, and deployment fallback. A React/TanStack client provides the responsive member interface, while Supabase provides PostgreSQL, Auth, Storage, Realtime, and Row Level Security.

Do not describe it as a Java-only application. It is a full-stack project with a substantial Java backend: 98 production Java files, 34 Java test classes, and 233 passing tests.

## Verified Status

| Area                 | Result       | Evidence                                                                              |
| -------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Java compilation     | Pass         | 98 production sources compile on Java 21 target                                       |
| Java tests           | Pass         | 233 tests, 0 failures, 0 errors, 0 skipped                                            |
| Frontend lint        | Pass         | 0 errors and 0 warnings                                                               |
| Localization         | Pass         | English and Myanmar catalogs both contain 596 keys                                    |
| Production build     | Pass         | Client, SSR, and Nitro server builds complete                                         |
| npm production audit | Pass         | 0 known vulnerabilities                                                               |
| Supabase RLS         | Pass         | All 33 public tables have RLS enabled                                                 |
| Database types       | Pass         | Regenerated from the live 33-table production schema                                  |
| Database indexes     | Pass         | All foreign keys now have covering indexes                                            |
| Vercel frontend      | Intermittent | Returned 200, but one later request timed out from this network                       |
| Railway backend      | Pass         | Health, admin login, frontend fallback, CORS, and auth proxy returned valid responses |
| Mobile registration  | Pass         | University, department, academic year, and city selectors verified at 390x844         |

## Safe Demo URL

Try the Vercel frontend first:

`https://campus-connect-ako890.vercel.app`

If it takes more than several seconds, immediately use the Railway fallback:

`https://campus-connect-backend-production-4525.up.railway.app`

Administration console:

`https://campus-connect-backend-production-4525.up.railway.app/admin/login`

Keep both URLs open before the presentation. Do not wait on a stalled Vercel tab during the demo.

## Recommended Demo Order

1. Open the landing page and explain the two user roles.
2. Show mobile-friendly current-student registration without submitting a new account.
3. Select **University of Computer Studies, Yangon** and show that its departments load dynamically.
4. Log in with your prepared member account.
5. Browse and filter the university directory.
6. Open a university and show campuses, departments, programs, source data, and saved-university behavior.
7. Open **Student Hub > Decision Center**, choose preferences, run the matcher, and compare universities.
8. Show the community feed, post interactions, questions, messaging, and notifications.
9. Open the separate Java administration console.
10. Explain the Java security architecture, moderator/super-admin roles, service/repository layers, CSRF, bearer-token validation, and immutable audit trail.
11. End with the database schema PNG and the 233-test result.

## Production Data To Know

The live database currently contains:

- 127 published universities.
- 237 departments.
- 22 visible posts.
- 5 questions.
- 1 active super administrator.

The following areas currently have no published/demo records:

- Question answers.
- Published opportunities.
- Active study-buddy profiles.
- Approved community university photos.

Those features are implemented and protected by tests, but their screens will show intentional empty states until records are created and approved. Do not make an empty screen the center of the live demo unless you first prepare suitable demo data through the normal workflows.

## Java Architecture Talking Points

- `SecurityConfig` defines separate ordered security chains for `/admin/**` and the stateless JSON API.
- `SupabaseAuthenticationFilter` validates member bearer tokens for protected API requests.
- `AdminSessionService` creates independent administrator sessions only for active `admin_users` records.
- Console controllers handle web requests; services enforce business rules; repositories isolate Supabase queries; mappers convert JSON responses into typed Java models.
- Administrative writes use server-only credentials and every moderation decision appends an immutable audit action.
- The frontend never receives the Supabase secret key.
- `FrontendFallbackController` provides a second member-app entry point for unreliable network conditions.
- English and Myanmar administration interfaces use Spring message bundles.

## Security Notes

Four public RPCs intentionally use `SECURITY DEFINER` because they perform narrow atomic actions. Each function checks `auth.uid()`, checks active-account status, limits changes to the caller's permitted records, sets an empty `search_path`, revokes execution from `PUBLIC` and `anon`, and grants execution only to authenticated users.

Supabase leaked-password protection is still disabled. Enable it from the Supabase Auth dashboard before a public launch. It does not block the classroom presentation, but it should be stated as a production-hardening item if asked.

## Reproducibility Note

The repository includes all feature migrations from the administration module onward, but the earliest production baseline migrations were created before the current migration folder and are not present in Git. The deployed database is complete and migration history is healthy, but a brand-new Supabase project cannot currently be reconstructed only from the checked-in SQL files.

For the presentation, describe Supabase as the deployed persistence platform and show the live schema visualizer. Before handing the project to another developer for a fresh installation, export and commit a sanitized baseline schema from Supabase.

## Before Entering The Room

- Charge the laptop and use a stable network or hotspot.
- Open both the Vercel and Railway member URLs.
- Open the Railway admin login page.
- Confirm your member and administrator credentials privately; do not put them in slides or source code.
- Log in once before presenting so account access is confirmed.
- Keep the database schema PNG available locally.
- Keep screenshots available in case the venue network fails.
- Run `mvn -f backend/pom.xml test` and save the final result showing 233 passing tests.
- Do not run package installation or deployment commands during the presentation.

## Supporting Files

- `PROJECT_DETAILS.md` - complete project description.
- `PROJECT_FLOWCHART.md` - full product and system flows.
- `docs/database-schema-visualizer.png` - production database schema poster.
- `README.md` - setup, environment, and administrator bootstrap instructions.
