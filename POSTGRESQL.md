> **Current database: Neon cloud PostgreSQL.** See [NEON_SETUP.md](NEON_SETUP.md) for the active connection, verification results and deployment instructions. Local database instructions below describe the preserved fallback.

# FRAME PostgreSQL

FRAME now uses PostgreSQL locally, through Django's ORM. SQLite is retained only as a rollback snapshot. The current administrator and any current records were copied; previously deleted accounts were not restored.

## Local Windows instance

Run `./start-local-postgres.ps1` from this folder to start the database after a computer restart. `./start-frame.ps1` also starts this configured local database before starting Django. It listens only on `127.0.0.1:55432`; it is not exposed to the network and no Windows service is installed.

The actual connection string is private in `backend/.env` under `DJANGO_DATABASE_URL`. Do not upload that file. Data, PostgreSQL credentials, and logs are in ignored `backend/data/`. The local server binaries are referenced by `backend/data/postgres-local.json`; moving the project to another computer requires installing PostgreSQL there and changing the URL.

The local application role can create temporary test databases. For a hosted database, use a dedicated role without superuser or CREATEDB privileges, with ownership/access only to FRAME's database.

## Backups and restore

Run `./backup-postgres.ps1` to create a timestamped custom-format PostgreSQL dump in `backend/data/backups/`. Keep encrypted copies outside this computer before launch. The helper is for this local instance. Test restores into a separate, empty database using `pg_restore --no-owner --no-acl -d <restore-database> <dump>` with private credentials. Never restore over the live database without a maintenance window and a current backup.

To stop the local database, use the `pg_ctl.exe` path and data path in `backend/data/postgres-local.json`: `pg_ctl -D <data-path> -m fast -w stop`. Stop Django first. Do not delete the data directory or Docker volume.

## Docker deployment

Copy `deployment.env.example` to `.env` in this folder and set a private Django secret and a long random URL-safe database password. Keep backend TMDB and email credentials in `backend/.env`.

```powershell
docker compose up --build -d
docker compose exec backend python manage.py createsuperuser
```

The Compose database starts first, passes a readiness check, and persists in the `frame-postgres` volume. Django runs schema migrations at startup. The database port is not published. This creates a separate deployment database: it does not automatically contain your local records. For an initial data transfer, stop local writes, create a local dump, then restore it into an empty deployment database before enabling traffic. Protect the site with HTTPS and configure its actual hosts, origins and secure cookies before a public launch.

For managed PostgreSQL instead, set the provider's private `DJANGO_DATABASE_URL` (usually including `?sslmode=require`) in the backend environment; replace the Compose database URL and remove the local database dependency. No hosting account has been provisioned by this migration.

## Repeatable SQLite import

With Django stopped and PostgreSQL schema migrated into an empty destination:

```powershell
python manage.py import_sqlite --source <absolute-path-to-SQLite-snapshot>
```

This command opens SQLite read-only, refuses an occupied destination, uses Django natural foreign keys for permissions, verifies all exported records inside the import transaction, and preserves password hashes, IDs, relationships, binary profile images and sessions. Temporary fixture files stay under ignored `data/` and are removed on success. A failed import rolls back records. Check the snapshot date: pre-reset backups can contain deleted accounts and must not be imported.

## Verification

From an activated backend environment: `python manage.py check --database default`, `python manage.py showmigrations`, and `python manage.py test core`. Tests use a separate `test_frame` PostgreSQL database and do not add synthetic users to the live database.

References: [Django management commands](https://docs.djangoproject.com/en/5.2/ref/django-admin/), [PostgreSQL Windows packages](https://www.postgresql.org/download/windows/), [PostgreSQL initialization](https://www.postgresql.org/docs/17/app-initdb.html).

### Completed checks — 27 October 2026

- PostgreSQL 17.11 initialized with SCRAM password authentication and loopback-only access.
- Current SQLite snapshot imported; all 4 exported records compared successfully, including the requested administrator and existing sessions.
- All 18 Django integration tests passed against a separate PostgreSQL test database.
- Local PostgreSQL startup and backup helpers ran successfully.
- A custom-format backup restored into a temporary PostgreSQL database; every public table matched. The temporary database was removed afterward.
- Live Django reports PostgreSQL; the current account count is 1 (the requested administrator). Frontend API health and admin login page return HTTP 200.
- Docker configuration was prepared but not executed: Docker is not installed on this machine. Hosted PostgreSQL and public deployment have not been provisioned.
