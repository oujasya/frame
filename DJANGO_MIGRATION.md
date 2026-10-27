> Database update: PostgreSQL is now active. Any SQLite defaults below describe the earlier migration. Use [POSTGRESQL.md](POSTGRESQL.md) for current database operations.

# FRAME now runs on Django

The React/Vite interface uses Django + Django REST Framework at the same `/api/...` routes. The backend uses Django ORM models and schema migrations. FastAPI is no longer the running server.

## Run locally

From `backend/`, create/activate a virtual environment, install `requirements.txt`, copy `.env.example` to `.env` if needed, then run:

```text
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

From `frontend/`, install dependencies and run `npm run dev`. Open http://127.0.0.1:5173/.

The Windows `start-frame.cmd` / `start-frame.ps1` launcher installs dependencies, runs migrations, and launches Django and Vite.

## Database and reset

The current database is `backend/data/frame-django.sqlite3`. Django manages users, sessions, watchlists, diary entries, lists, social interactions, profiles, image blobs and email tokens through its ORM.

All former live accounts and their associated data were explicitly deleted at your request before import. The active Django database therefore starts with **zero accounts**. No test accounts are added to it by the test suite.

The old `backend/data/frame.db` is retained for rollback and was imported only after the account reset. Private, ignored database backups under `backend/data/` include a backup made before the requested reset. Those backup files can contain deleted account data; they are not used by the running app and must not be published or shared. Deleting the backup files permanently is a separate action.

To import a different legacy SQLite database into an empty Django database:

```text
python manage.py import_legacy --source /absolute/path/to/old-frame.db
```

The importer makes a private backup, never edits the source, preserves record IDs and active session tokens, and refuses to import into a populated destination. Repeating a completed import is a no-op. Existing scrypt password hashes are wrapped in a Django-compatible hasher; a successful login upgrades them to Django's current preferred hash. No plaintext password is required.

## Admin and reports

Open http://127.0.0.1:8000/admin/ (also proxied at port 5173). Create your own administrator locally:

```text
python manage.py createsuperuser
```

No admin credentials have been invented. Django admin manages accounts, reports, reviews, lists, follows and profiles. Normal FRAME accounts are not administrators.

## PostgreSQL

SQLite remains the active local database. To use PostgreSQL, create a database and set a real connection URL in `DJANGO_DATABASE_URL`, then run `manage.py migrate`. Example only:

```dotenv
DJANGO_DATABASE_URL=postgresql://frame:YOUR_PASSWORD@localhost:5432/frame
```

If moving existing Django data between database engines, export/import with Django's tools or a planned migration; changing the URL does not copy data automatically. The legacy import command can import directly into an empty PostgreSQL destination.

## Security and email

- API session cookies remain HTTP-only. React obtains a Django CSRF token from `/api/csrf` and sends it for every mutation, including login and signup. Django checks CSRF and allowed origins.
- Django admin uses its own standard Django session.
- Local development creates a private ignored key at `backend/data/django-secret.key`. Production requires `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, explicit `DJANGO_ALLOWED_HOSTS`, trusted frontend origins and HTTPS/secure cookies.
- Verification and password-reset emails now use Django's mail backend with the existing SMTP environment variables. See `EMAIL_SETUP.md`. Credentials are still required for live delivery.
- Configure production logging and shared throttling/cache storage for multiple workers. Default throttling is process-local development storage.
- Keep both the Django database and any retained legacy backups private. Continue to back up persistent storage before deploying schema changes.

## Validate

```text
python manage.py check
python manage.py test core
python manage.py makemigrations --check --dry-run
python manage.py collectstatic --noinput
```

The Django tests use a separate temporary test database. They cover authentication/CSRF, privacy, watchlists, diary and scores, lists, interactions, profiles, images, email flows, admin access and legacy hash/session import. React production builds are checked separately.

## Archived FastAPI code

The previous backend and tests are retained in `backend/legacy_fastapi/` with their previous requirements. They are not imported by Django. For a deliberate rollback, use an isolated environment with `legacy_fastapi/requirements.txt`, run its old ASGI app with that directory on `PYTHONPATH`, select the intended legacy database, and restore `frontend/src/api.fastapi-backup.txt` as `api.js` because the Django client now requires a CSRF endpoint. Do not run both backends writing to the same database.
