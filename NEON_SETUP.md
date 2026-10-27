# FRAME on Neon

## What is connected

- Organization: `org-green-rain-89148189`
- Project: `autumn-glade-50916657`
- Production branch: `production` (`br-weathered-forest-b4euqqys`)
- Service: PostgreSQL only. Existing Django authentication, profiles, diary, lists, social features and TMDB integration remain in place.

The database is hosted by Neon. The React and Django servers still run on this computer; hosting those servers is a separate deployment task.

## Configuration

`neon init` created the ignored `.neon` link, the PostgreSQL-only `neon.ts`, and root `package.json`/lockfile with `@neon/config` and `@neon/env`. `neon deploy` reported that production already matched that policy and pulled `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `NEON_BRANCH` into ignored `.env.local`.

Django reads that root file server-side, followed by the root `.env` and backend `.env` as defaults. Environment variables explicitly supplied by the hosting platform take precedence. Existing backend TMDB/email secrets were preserved. The old unused SQLAlchemy `DATABASE_URL` example was removed from the private backend file to prevent ambiguity. `DJANGO_DATABASE_URL` is still supported for deployments and the preserved local fallback.

Application traffic uses the pooled `DATABASE_URL`, with Django's existing psycopg 3 driver. Server-side cursors and automatic prepared statements are disabled for transaction-pool compatibility. Database connections have a timeout and health checks. Django management commands that change schema or import/export data automatically use `DATABASE_URL_UNPOOLED`, which connects directly. Credentials never use a `VITE_` prefix and are not included in the frontend.

`npm run build` from this folder delegates to the React production build. `npm run dev` runs Vite; start Django separately or use `start-frame.ps1` as before. When the Neon root env file is present, the launcher no longer needs to start the old local database.

`compose.neon.yaml` is an optional deployment configuration using cloud PostgreSQL, with no local database container. The existing `compose.yaml` remains available for self-hosted PostgreSQL. Before public deployment, configure a private production Django secret, real hostnames, HTTPS, and secure cookies. Docker has not been installed or run here.

## Agent tools and preserved settings

The requested `neon init -y` installed the Neon plugin globally for Codex and VS Code, plus user-level Neon skills and MCP configuration for the detected GitHub Copilot agent. The plugin supplies both the Neon skills and its OAuth MCP server at `https://mcp.neon.tech/mcp`. No duplicate project MCP server was added. Global plugin installation applies to this project; MCP tools may require a new agent session and their own OAuth sign-in. CLI authentication is working and is used for this setup.

The exact official skill was fetched from [Neon's published skill](https://neon.com/.well-known/agent-skills/neon/SKILL.md). Its existing-ORM, pooled/direct connection, secret-handling and branch-validation guidance was followed. The installed PostgreSQL and branching skills were also consulted.

## Backups and rollback

The original local PostgreSQL database and its verified custom-format backup remain under ignored `backend/data/`. Existing records were transferred using Django natural foreign keys, with a full record comparison including IDs, password hashes, sessions, JSON fields and image data. No pre-account-reset backup was imported.

To use the local fallback deliberately, stop Django and start local PostgreSQL using `start-local-postgres.ps1`. Explicitly supply its private URL as both `DJANGO_DATABASE_URL` and `DATABASE_URL_UNPOOLED` before restarting or running management commands. Never print or commit the values. The cloud and local databases are independent after cutover: new writes are not mirrored.

For new backups use PostgreSQL `pg_dump` against `DATABASE_URL_UNPOOLED`, passing credentials through private environment/configuration rather than command history. The old `backup-postgres.ps1` helper targets only the preserved local database; it is not a cloud backup. Test restores into a separate database or branch.

## Repeating validation

Create a disposable Neon branch with an expiry and use separate private environment storage. Run migrations via its direct URL and start the app via its pooled URL. Keep synthetic users off production. The normal Django integration tests use a separate test database; branch validation can explicitly reuse an otherwise empty disposable branch database with `FRAME_TEST_DATABASE_NAME` and `--keepdb`. Never set that option to the production database.

## Failures encountered

- Initial plugin installation failed because this machine's bundled npm launcher resolved an invalid `npm-prefix.js` path. Private workspace npm/npx wrappers fixed it; the retry succeeded.
- Initial `neon init` linked offline because no CLI account was signed in. Browser OAuth completed successfully, and `neon deploy` then verified the actual project and pulled its environment.
- The web fetch tool could not open the supplied skill URL; direct HTTPS download succeeded.
- Two preliminary diagnostic commands used an incomplete Python dependency path and an unsupported psycopg connection-info attribute. Correcting the dependency path and querying PostgreSQL's TLS status resolved those checks.
- The first browser login listener timed out; the subsequent deploy browser flow completed OAuth successfully. No authentication issue remains.
- A transfer diagnostic initially checked `pg_stat_ssl`, which describes the proxy-to-compute connection. The data comparison had passed; checking psycopg's client-side TLS status correctly verified the encrypted connection to Neon.

## Verification completed — 27 October 2026

The disposable branch `frame-migration-check-20261027` was used for migrations, tests, real HTTP writes and a trial of the actual data transfer. It was deleted afterward; the project has only its original production branch remaining. Synthetic test accounts were not added to production.

Relevant command output:

```text
neon deploy
No changes — branch production already matches the policy.
Utilized services: Postgres
Pulled 3 Neon variables into .env.local

npm run build
✓ 80 modules transformed.
✓ built in 901ms

python manage.py test core --keepdb --noinput --verbosity 1
Ran 18 tests in 206.259s
OK

POST /api/auth/signup: HTTP 201
POST /api/auth/login: HTTP 200
POST /api/watchlist: HTTP 201
GET /api/watchlist: HTTP 200
POST /api/diary: HTTP 201
GET /api/diary: HTTP 200
DELETE /api/account: HTTP 204

Cloud import verified: 4 records match, including existing account password hashes and sessions; TLS active.
Production Django: Neon pooled PostgreSQL, TLS active, administrator preserved, account count 1.
GET /: HTTP 200
GET /api/health: HTTP 200
GET /api/csrf: HTTP 200
GET /api/profiles/oujasya: HTTP 200
GET /admin/login/: HTTP 200
Frontend artifact scan: no Neon connection strings or passwords embedded.
```

The real HTTP flow ran against a started Django server on the isolated branch using the pooled cloud connection, and checked read-after-write persistence. Production checks ran through the normal Vite frontend proxy after restarting Django on Neon. The final transfer preserved all four current serialized records and the requested administrator. Local PostgreSQL and SQLite snapshots remain private rollback material, with no active synchronization to Neon.

No credentials are included in this document.
