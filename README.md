> **Current database: Neon cloud PostgreSQL.** See [NEON_SETUP.md](NEON_SETUP.md) for the active connection, verification results and deployment instructions. Local database instructions below describe the preserved fallback.

# Active database: PostgreSQL

FRAME now runs on local PostgreSQL. See [POSTGRESQL.md](POSTGRESQL.md) for startup, backups, Docker deployment and managed hosting. Current Django data was migrated with record verification; SQLite snapshots are retained only for rollback.

# FRAME — Django + React

**The active backend is now Django + Django REST Framework.** The earlier FastAPI implementation is archived, not running. Start with [DJANGO_MIGRATION.md](DJANGO_MIGRATION.md) for current run, admin, database and migration instructions. Historical notes below describe earlier iterations and may refer to superseded FastAPI commands.

Quick start: install `backend/requirements.txt`, run `python manage.py migrate` and `python manage.py runserver 127.0.0.1:8000` from `backend/`; run `npm ci` and `npm run dev` from `frontend/`. Open http://127.0.0.1:5173/. Admin: http://127.0.0.1:8000/admin/ after running `python manage.py createsuperuser` yourself.

Current database: `backend/data/frame-django.sqlite3`. All current accounts were removed at your request before migration; create a new account to start again. Private rollback backups remain ignored in `backend/data/`. Email delivery still needs your SMTP provider credentials; see [EMAIL_SETUP.md](EMAIL_SETUP.md).

---

# FRAME — Day 1

A cinematic movie discovery app built with React, Vite, Tailwind CSS and FastAPI. Includes real signup/login/logout, editable profiles, persistent private watchlists, movie search, movie summaries and a TMDB backend proxy.

## Run locally

Requirements: Node.js 22.12+ (or supported newer LTS), Python 3.12+, and npm. PostgreSQL is planned for Day 2; Day 1 uses SQLite with no extra setup.

Open two terminals from this folder.

Windows shortcut: double-click `start-frame.cmd` to install dependencies and launch both servers. Keep its console open while using FRAME. If PowerShell's script policy prevents that shortcut, use the manual commands below without changing the policy.

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux: use `python3`, `.venv/bin/python`, and `cp .env.example .env` instead. Activation is optional; commands above use the virtual environment directly.

### 2. Frontend

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Visit **http://localhost:5173**. Use this exact origin for cookie and origin validation. Vite proxies `/api` to port 8000. API documentation: **http://127.0.0.1:8000/docs**.

The default frontend uses a clearly labeled sample movie collection with cinema mood photographs, explicitly marked as mood images rather than actual film posters. Signup, profile changes and watchlist changes always use the real backend and SQLite, including in sample mode. No fake account or credentials are included. Create your own account with a username and password. Click your display name to edit your profile, bookmark a film, sign out and log back in to verify persistence.

SQLite is created at `backend/data/frame.db`. Do not commit it. Override `SQLITE_PATH` for hosting. Back up this file to preserve accounts and watchlists. Profiles expose only username, display name and bio; watchlists require the owner's session.

## Connect live TMDB

The backend also supports a TMDB v3 API key through `TMDB_API_KEY` in `backend/.env`. Either credential works; when both exist, the Read Access Token takes precedence. Keep both credentials out of frontend variables and archives. The local app is now configured for live mode; restart both servers after changing backend credentials.

1. Obtain your own TMDB API Read Access Token from your TMDB account's API settings.
2. Put it in `backend/.env` as `TMDB_READ_ACCESS_TOKEN=...`.
3. Set `VITE_DEMO_MODE=false` in `frontend/.env`.
4. Restart both servers.

Never put a TMDB token in a `VITE_` variable: those are public browser build settings. Without the token the live API returns a structured 503 and the frontend displays a recoverable error. It never substitutes samples while claiming to show live charts. Sample posters still need network access; failed images display a deliberate title fallback.

Artwork connectivity: `image.tmdb.org` timed out in the build environment. Sample mode therefore uses reachable Unsplash cinema photography immediately. Live mode tries genuine TMDB posters first and falls back to labeled mood images when loading fails. All images still require internet access; failed mood images display the film title. Cinema imagery: [auditorium](https://unsplash.com/photos/evlkOfkQ5rE), image IDs `photo-1489599849927-2ee91cede3ba`, `photo-1478720568477-152d9b164e26`, and `photo-1440404653325-ab127d49abc1` served by images.unsplash.com. These are editorial mood images, not film artwork or endorsements.

## Structure

```text
frontend/          React app, Tailwind Vite integration, local font assets
  src/App.jsx      Discovery, search, account/profile forms, movie and watchlist UI
  src/demo.js      Disclosed fixed sample collection
backend/
  app/main.py      FastAPI and bounded TMDB proxy
  app/accounts.py  SQLite accounts, password hashing, cookie sessions, profiles/watchlists
  tests/           Proxy and account integration tests
compose.yaml       Local production-style build with persistent database volume
```

## API

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/health` | Process status and TMDB configuration flag |
| GET | `/api/movies/trending?page=1` | Weekly TMDB movie trends |
| GET | `/api/movies/popular?page=1` | Popular movies |
| GET | `/api/movies/search?query=Arrival&page=1` | Search, validated query and pagination |
| GET | `/api/movies/{id}` | Movie details |
| POST | `/api/auth/signup` | Create username/password account and session |
| POST | `/api/auth/login` | Authenticate and set HTTP-only cookie |
| POST | `/api/auth/logout` | Revoke current session |
| GET | `/api/auth/me` | Current authenticated profile |
| GET | `/api/profiles/{username}` | Public profile |
| PATCH | `/api/profiles/me` | Edit own display name and bio |
| GET/POST | `/api/watchlist` | Read or save own movies |
| DELETE | `/api/watchlist/{id}` | Remove own saved movie |

Sessions expire after seven days. Passwords use salted scrypt; only a SHA-256 digest of the random session token is stored in the database. Cookies are HTTP-only, SameSite=Lax and can be Secure in HTTPS hosting. Mutating browser requests validate Origin against `CORS_ORIGINS`. The backend never forwards upstream error bodies or credentials to the client.

## Checks

```powershell
cd backend
.venv\Scripts\python -m pytest tests -q
```

```powershell
cd frontend
npm run build
npm run preview
```

The production output is `frontend/dist`. Vite preview is for checking builds, not production hosting.

## Deployable layout

With Docker Desktop installed, run `docker compose up --build` from this folder and open **http://localhost:8080**. This serves the built frontend through Nginx and proxies `/api` to FastAPI on the same origin. Accounts persist in a named volume. Optionally set `TMDB_READ_ACCESS_TOKEN` and `VITE_DEMO_MODE=false` in your shell before the build. Do not remove the database volume when updating the app.

For public hosting: put the application behind HTTPS, set `COOKIE_SECURE=true`, and set `CORS_ORIGINS` to the exact public frontend origin. Run one FastAPI worker with the SQLite version and a persistent disk. Move to PostgreSQL before multiple replicas. `DATABASE_URL` is a documented Day 2 placeholder and is not used yet.

For separate frontend/backend hosts, set `VITE_API_BASE_URL` to the backend origin at build time and configure backend CORS. Prefer the included same-origin deployment; unrelated cross-site domains need a separate cookie/CSRF design and are not supported by the default SameSite=Lax setup.

Before an unrestricted public launch, add edge rate limits for auth and proxy endpoints, email verification and password reset, production backups, monitoring, privacy/terms appropriate to the service, and PostgreSQL migrations. Social login, user avatar uploads and a follower feed are not implemented. Email password recovery is implemented but requires SMTP configuration. Ratings, reviews and the watched-film diary are implemented.

## Five-day MVP plan

| Day | Deliverable |
|---|---|
| 1 — implemented | Discovery, sample/live modes, search groundwork, login/signup, profiles, durable watchlists, proxy, Docker setup |
| 2 | PostgreSQL with SQLAlchemy/Alembic migrations; account recovery and auth rate limits |
| 3 | Ratings, reviews and diary entries; ownership validation and movie detail pages |
| 4 | Public profile pages, following and activity feed; search pagination and responsive QA |
| 5 | Integration tests, accessibility/performance pass, HTTPS deployment, backups, policy pages and release |

## Data and design references

Movie metadata and artwork: [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB. Review TMDB's attribution and licensing requirements before release. The fixed sample descriptions are short original summaries, not live chart data. Manrope is bundled through Fontsource; Solar interface icons load through Iconify.

Implementation references: [TMDB authentication](https://developer.themoviedb.org/v4/docs/authentication-application), [movie search](https://developer.themoviedb.org/docs/search-and-query-for-details), [Vite](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).

See `DESIGN.md` for the approved direction, supplied-skill coverage and verification limits.

## Delivered verification

The Vite production build passed and all three backend integration tests passed, including account creation, duplicate username handling, login/logout, profile edits, cross-user watchlist isolation, persistence, request-origin rejection, missing TMDB configuration and upstream failures. Tests use mocked TMDB; a live TMDB request was not tested without credentials. One dependency deprecation warning concerns Starlette's test client using httpx.

`preview.html` is a self-contained visual preview with sample movie browsing and search; account actions explain how to start the real server. Keep `frontend/dist/assets` alongside it for local font assets. The real app must run over HTTP using the launcher, manual instructions, or Docker. Automated browser rendering could not be inspected: local addresses timed out in this environment and the browser security policy blocks automated inspection of `file:` URLs. Docker execution and the Windows launcher were not run on the user's host.


## Ratings, reviews and film diary

Open any film and scroll to **Your take on this film**. Log a viewing with an optional half-star rating (0.5–5), watched date and review. Choose whether to publish the rating/review and mark spoilers when needed. Watched dates and the diary listing remain private. Public reviews appear in that film's community section with spoilers hidden until expanded. Each member's latest public rating contributes once to the average, even after repeat viewings.

The **Diary** tab shows your logged viewings, distinct-film count, review count and mean rating across rated viewings. Filter by film title or year, edit entries, or delete after confirmation. Log another viewing from the movie dialog for rewatches. New database tables are created additively at startup; existing accounts and watchlists are preserved.

New endpoints: `GET/POST /api/diary`, `PATCH/DELETE /api/diary/{entry_id}`, and `GET /api/movies/{movie_id}/reviews?page=1`. Writes validate ownership and request origin; public review queries exclude private entries. Reviews are rendered as plain text. Community pages contain up to 20 reviews.

Verification for the journal update: production build passed; five integration tests passed, including review visibility, multiple viewings, edit/delete ownership, invalid ratings and dates, and persistence after login. Runtime endpoints were checked through the frontend proxy. Automated browser interaction remains unverified due to the earlier browser policy restriction.


## Full-page movie view

Movie cards, titles, featured-film buttons and diary posters now open a full detail page at `#/movie/{id}`. The page fetches full TMDB details, displays the real backdrop/poster, synopsis, runtime, language, genres and TMDB rating, and keeps watchlist controls and FRAME reviews on the same page. Direct movie links and refresh load the selected movie. Use Back to browsing or browser Back to return; navigation and search leave the movie page. Login opens over the page without losing the selected movie.


## Country-based discovery and homepage motion

Signup now requires a country. Existing accounts keep all data and can select a country in their profile; migration adds a nullable country column without guessing one. Country is included only in authenticated account responses, not public profiles. The homepage uses the authenticated account's country for `GET /api/movies/country`; it cannot be overridden by a country query parameter. Profile changes refresh this section automatically.

"Top in [country]" selects movies with releases in that region and ranks them by TMDB's global popularity. TMDB does not expose a country-specific popularity chart here; the UI explicitly explains the distinction. It is not a streaming availability guarantee. Reference: https://developer.themoviedb.org/reference/discover-movie

Homepage poster cards have restrained lift, image zoom, title emphasis and a view-film hint for fine-pointer hover. Keyboard focus exposes the hint without movement. Touch needs no hover, and reduced-motion settings disable transforms.

Country discovery now uses TMDB `with_origin_country`, not regional release availability. The homepage says “Movies from [country]” and includes all original languages, sorted by popularity, with future primary releases excluded.


Homepage collections now use one horizontal row of up to 20 real results plus a poster-sized Discover more card. Hover reveals scroll arrows on fine-pointer devices; keyboard focus also reveals controls and touch devices support swiping. Poster hover adds a faint orange glow. Discover more opens the matching full-grid collection, with additional TMDB pages and the same country-of-origin filter for local films. Failed page requests retain existing movies and can be retried.


## Everyday watch flow

Watchlist supports title search, release-year filters and sorting by recently added, added first, A–Z, newest release or TMDB score. Choose **Mark watched** on a saved film to open its full page at the diary form. This starts a new viewing even for a film logged before. Save a date, optional rating/review and visibility; the checked **Remove from my watchlist after logging** option removes the saved film atomically in the same transaction that creates the diary entry. Invalid submissions leave both lists unchanged. Uncheck it to keep the film saved.

Ordinary movie opening restores the latest viewing for editing and displays your latest recorded rating. **Log another viewing** creates a separate rewatch entry. Homepage row positions, watchlist filters, diary controls and loaded category pages remain mounted while viewing a film, so Back restores their place. Returning to search no longer repeats the first-page request unnecessarily.

Verification: production build and nine backend tests passed. The added test verifies optional watchlist removal, diary creation and rollback on invalid data. Visual/browser interactions remain unverified under this session's earlier browser policy restriction.


## Completed basic-feature pass

1. **Search:** Search navigation, page controls up to TMDB's 500-page limit, release year, genre and original-language filters. Empty title uses TMDB Discover with upstream filters. Title search is paginated by TMDB Search; because that endpoint does not accept genre/language filters, those two filters select matching items on each fetched page, with this explicitly stated in the interface. An empty filtered page can still advance to later pages.
2. **Movie details:** Credits, directors, cast portraits, release/status/country details, links to actual YouTube trailer results, and related films. No trailer or cast data is invented. Related films open the same full-page movie experience.
3. **Account settings:** Current-password-verified password changes and recovery-address updates; password changes revoke prior sessions. Account deletion requires both the current password and exact username confirmation and deletes the user's saved records in one transaction. Recovery sends 30-minute, single-use reset links using SMTP. No SMTP credentials were invented or configured: populate `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, optional `SMTP_USERNAME`/`SMTP_PASSWORD`, and `APP_PUBLIC_URL` on the backend. Without these, recovery shows an explicit unavailable message. Recovery addresses should be double-checked; email-address verification is not included yet. Reset tokens are hashed at rest, never returned by the API, and invalidate existing sessions on use.
4. **Public profiles:** Click a review author's name or choose View public profile in your own profile editor. Share `#/u/username`. Counts and activity include only public entries; private dates, country, recovery address and private diary entries are excluded. Activity has 20-entry page controls.
5. **Navigation:** Refreshable hash links for discover, popular, search/filter/page state, categories, films, profiles, watchlist, diary, settings and password recovery; browser Back/Forward support, saved return scroll positions and a useful unknown-page view. Category refresh resumes its current result page rather than recreating all earlier loaded pages.
6. **Recovery and performance:** Bounded server and browser metadata caches, duplicate GET-request suppression, explicit stale-result notices, a client request timeout, offline notice, retryable errors and a render-error recovery screen. Account, private diary, member profile and public review responses are not cached by the browser metadata cache. Each homepage list can load independently instead of one failed list hiding all results.

Verification: production build, 13 backend integration tests and route-unit checks passed. These cover search query parameters/filtering, appended movie data, password changes, old-session revocation, expired/used reset tokens, confirmed deletion, public/private separation, regional discovery and cache recovery. Email delivery is tested through a mocked sender; real SMTP delivery is unverified until configured. Browser visual and interaction checks remain unverified because the browser policy in this session blocked preview inspection. Public launch still needs deployment-specific abuse controls and email delivery validation.

Homepage Highest rated collection uses `/api/movies/top-rated` backed by TMDB `/movie/top_rated`, with twenty-film rows, hover arrows and a paginated Discover more page. It is explicitly labeled as TMDB community ratings, independent from FRAME ratings.


## Lists and community features

- **Lists**: create named film collections with descriptions, add films from a movie page, reorder or remove films, and edit/delete lists. Lists default to private; public lists have shareable URLs and appear on member profiles. Private list access is enforced by the server.
- **Review discussions**: like/unlike public reviews and post comments, with spoiler flags. Authors can delete their own comments. Discussions are available from movie reviews, public profiles and the following feed. Private entries never expose reactions or comments.
- **Activity**: search members by username or display name, open their profiles and follow/unfollow. The paginated feed contains only public ratings/reviews from followed members; watched dates stay private.
- **Stats**: private diary totals, distinct films, repeat viewings, average per-viewing rating, monthly viewings and rating distribution. Unrated entries count as viewings but not in the rating average.
- **Where to watch**: movie pages query TMDB's watch-provider endpoint using the authenticated member's saved country. Subscription, free, ad-supported, rent and purchase options are separate. Missing listings have an explicit empty state. Availability is provided by JustWatch via TMDB, with attribution and the supplied TMDB viewing link; no streaming availability is invented.
- **Spoiler preferences**: Settings includes a persistent hide-spoilers preference applied to public reviews and comments. Anonymous visitors hide flagged content by default and may reveal individual entries.

New API routes: `/api/lists`, `/api/lists/{id}`, `/api/lists/{id}/movies`, `/api/lists/{id}/movies/{movie_id}`, `/api/profiles/{username}/lists`, `/api/reviews/{id}/reactions`, `/api/reviews/{id}/like`, `/api/reviews/{id}/comments`, `/api/reviews/{id}/comments/{comment_id}`, `/api/members?q=...`, `/api/profiles/{username}/connections`, `/api/profiles/{username}/follow`, `/api/feed`, `/api/stats`, `/api/preferences`, `/api/movies/{id}/watch-providers`. List, comment, follow and settings mutations use authenticated sessions and the existing origin checks. Feed/comments use 20-item pages.

SQLite migrations run at backend startup. No new credentials are required. Account deletion also removes lists, discussion data and follower connections; diary deletion removes that entry's discussion data. Browser routes include `#/lists`, `#/lists/{id}`, `#/activity` and `#/stats`.


## Full-page member profiles

Click your name in the header to open your profile. Main navigation is now Discover, Search, Watchlist and Activity. Your profile houses Lists, Stats and your private Diary; direct legacy routes still work.

Profiles use a full-width banner and responsive page layout, with Overview, Reviews, Films, Lists, Stats, About, Followers and Following sections. Owners also have Diary and Edit profile. Follower counts open paginated member lists. Edit profile offers name/bio/country editing, favorite genres, image uploads, visibility controls and pinned public reviews/lists. Choose and reorder up to **five favorite films** using movie search. Visitor preview uses server-enforced public visibility and excludes owner tools. Public statistics use only public ratings; private diary statistics remain available only to the owner.

Avatar/banner uploads accept JPG, PNG and WebP under 2 MB and 20 megapixels. Pillow decodes, crops, re-encodes and strips metadata; images are stored in SQLite and served as WebP with no-sniff headers. Install backend requirements (now including Pillow) before deployment. No upload credentials or external storage service are needed for the local MVP; move binary storage to object storage when scaling.

Other members' profiles include taste comparison using latest public film ratings and visible favorites. Member controls provide blocking/unblocking and reporting. Blocking removes follows in both directions and prevents new follows, likes and comments between the members; public content remains public. Reports are persisted for the site administrator; there is currently no moderation dashboard, automated enforcement, or guaranteed response time. Account deletion removes profile images, favorites, settings, blocks and related reports.

API additions: `/api/profiles/{username}/details?visitor=true`, `/api/profile/details`, `/api/profile/favorites` (PUT), `/api/profile/images/{avatar|banner}` (PUT/DELETE), `/api/profiles/{username}/images/{kind}`, `/api/profiles/{username}/people?kind=followers|following&page=1`, `/api/profiles/{username}/compare`, `/api/profiles/{username}/block` (POST/DELETE), and `/api/profiles/{username}/report` (POST). Profile activity visibility is enforced both in the profile activity API and following feeds. Hidden profile activity does not make previously public film reviews private.

### Favorite Five banner update
The profile banner is now a CSS brick wall with exactly five framed poster slots. Owners click a frame to search, choose, replace or remove a film; visitors can open visible films. Changes save immediately. Empty positions remain fixed, duplicates are rejected, and hidden favorites render as empty frames for visitors. The old separate Favorite Five editor and banner-upload control are replaced by the wall. Existing uploaded banner data is retained but is no longer displayed. The favorites PUT endpoint accepts up to five Movie-or-null slots; profile details now include a five-item favorite_slots array alongside the existing compact favorites list.


Diary is now available directly in the main navigation again and is removed from profile tabs. Its existing private access and diary route are retained.



### Interface motion
FRAME now uses restrained 150–350 ms transitions: poster hover lift/glow, revealed poster actions, smooth movie rails, page and search-result entrances, backdrop/title staging, loading shimmer and image fades, favorite-frame spotlights and poster placement, sliding profile-tab indicator, avatar reveal, half-star feedback, saved-watchlist checkmarks, review-like pulses, expanding spoilers/comments, dialog entrances/exits, notification entrances/dismissals, list reordering and statistics bar reveals. Lists retain their rendered rows during refetch so reorder motion can follow the saved order. Success indicators reflect completed requests. Touch controls stay visible. Reduced-motion settings disable CSS and programmatic animation, including when the setting changes while FRAME is open. No animation library or new service credentials are required.


### Navigation redesign
The sticky navigation now uses a centered icon-and-label rail with a sliding active pill and separate hover highlight. The profile picture opens an account disclosure with Profile, Settings and Sign out. Smaller screens have an animated navigation toggle, retaining all five destinations including Diary. Escape closes open navigation/account panels, outside clicks close the account panel, and route changes dismiss both. Navigation includes visible focus states, accessible disclosure labels, watchlist counts and reduced-motion support. All icons are local SVG paths.

### FRAME layout redesign
The homepage now features a shorter film-led backdrop hero with movie information, View film and Watchlist actions. Horizontal collections keep their twenty-film Discover more behavior. Shared spacing, rounded panels, poster sizing, typography, empty states and buttons are standardized. Search exposes title autocomplete above a mobile filter disclosure. Watchlist includes functional poster/list layouts while retaining search, year and sort controls. Diary viewings are grouped by month, repeat viewings are marked, and long own reviews can be expanded. Movie pages have navigation to reviews, cast, providers and related films, with separate Public/FRAME scores retained and sticky-header-aware scrolling. Activity uses a central readable feed. Profile keeps its brick-wall Favorite Five, six primary tabs and a secondary section selector; owner editing, followers, comparison and controls remain available. No account data or backend schemas changed.


### Movie opening transition
Opening a film now uses a short stepped block wipe inspired by the supplied MP4: tiles spread from the lower center to cover the page, the movie route opens under the mask, then the same stepped pattern reveals the movie page. It applies to existing movie-opening actions across the site, preserves routing and scroll restoration, restores heading focus, cancels on browser history changes, and skips motion for reduced-motion settings or browsers without Web Animations support. A cleanup watchdog prevents a stuck overlay.

The movie-opening block wipe has been removed. Movie navigation is immediate again; other interface animations remain.


### Pip companion
Pip is a tiny CSS ivory pebble with two dot eyes and an orange accent, available across routes. Click Pip to open a compact helper panel. It can choose a real saved watchlist film, fetch mood/genre-based TMDB discovery, link to the current film, provide review-starting questions and open the diary/journal. These are explicit shortcuts and randomized selections, not AI-generated advice or conversational AI. No AI provider or new credentials are connected.

Pip blinks, floats, reacts to completed saves/logs, tilts, has a thinking state, and sleeps after inactivity. Quiet mode turns off pet animation; system reduced-motion preferences also apply. Hide/quiet choices are local browser preferences with a Show Pip restore button. Conversation state stays in memory and resets when the signed-in account changes. New requests cancel older ones; stale account responses are ignored. The panel supports Escape and keyboard focus, stays within mobile viewport safe areas and hides behind account dialogs. No uploaded mascot assets or external tracking are used.


### Full-page account access
Login and signup now have dedicated, refreshable `#/login` and `#/signup` pages, with a cinematic poster panel on larger screens and a focused mobile form. Password visibility controls, confirmation on signup, length/match feedback, Caps Lock feedback, field hints, busy states and focused error messages improve usability. Country selection still personalizes movie discovery. Authentication uses the existing backend/session cookies; no credentials are stored in browser storage. Entering account access from a film, watchlist or diary returns there on success. A failed watchlist fetch no longer turns a successful login into an authentication failure. Existing signed-in visitors see a Continue action instead of a second login form. Password recovery remains dependent on configured SMTP; no social login or email verification is implied.

### Signup contact and birth date
New signup requests require email (a Gmail address ending in @gmail.com) and birth_date (ISO YYYY-MM-DD, between 1900-01-01 and today). The backend normalizes Gmail addresses, prevents duplicate addresses, and stores both fields privately. Signup initializes the recovery email to the provided Gmail address; it does not verify ownership or send mail without configured SMTP. Existing users are migrated with nullable fields and can still log in. Neither field is exposed by auth/me or public profile APIs. The signup form includes native email/date validation and privacy hints.


### Verified recovery email
See [EMAIL_SETUP.md](EMAIL_SETUP.md) to connect Resend or Gmail SMTP. New signup attempts verification delivery, but remains successful if the mail provider is unconfigured. Settings allows existing users to save an address using their current password and request/resend verification. Links are hashed, expire after 24 hours, and are single-use. Password-reset email is sent only for verified addresses. Changing an address revokes old verification and reset links. Password reset uses a confirmation field and removes the token from the URL after success. Mail transport uses certificate-validated TLS. Automated tests cover a captured SMTP flow; live inbox delivery remains dependent on user-supplied credentials and sender setup.
