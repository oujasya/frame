# Put FRAME online on Render

The supplied `render.yaml` deploys one free Docker web service. React, Django, `/api`, and `/admin/` share a single HTTPS URL, so login cookies need no cross-site workaround. PostgreSQL stays on the already configured Neon production branch. Render may assign a suffix to the service name; Django automatically uses the actual `RENDER_EXTERNAL_HOSTNAME` for allowed hosts, CSRF and email links.

## 1. Upload the clean project to GitHub

Create a **private** GitHub repository named `frame`. Extract `frame-render-upload.zip`, then upload its contents into the repository root (not the enclosing folder). Upload the `frontend` folder first and commit it; then upload `backend` and the root files in a second batch to keep each browser upload small. The root must contain `render.yaml`, `Dockerfile.render`, `backend/` and `frontend/`.

The upload package contains only selected source and deployment files. It excludes real `.env` files, Neon links, database files/backups, dependencies, old backend backups, screenshots and generated build files. Keep real credentials out of GitHub. Examples contain no real keys.

GitHub's browser upload can omit hidden files. The Docker-specific ignore file is named `Dockerfile.render.dockerignore`, so it remains visible and protects the build context. Use the prepared package rather than uploading the entire working folder.

## 2. Create the Render Blueprint

In Render choose **New → Blueprint**, connect GitHub, and select the `frame` repository. Render should detect `render.yaml` and show one service on the **Free** plan. Review the selected plan before deploying.

When prompted, copy these private values from the existing root `.env.local` and `backend/.env` on this computer into Render:

| Render variable | Source |
| --- | --- |
| `DATABASE_URL` | Root `.env.local`: pooled Neon URL |
| `DATABASE_URL_UNPOOLED` | Root `.env.local`: direct Neon URL |
| `TMDB_READ_ACCESS_TOKEN` | `backend/.env`: the existing TMDB read token |

If only the TMDB API key is configured locally, set `TMDB_API_KEY` instead in Render's Environment settings. Do not paste values into chat or commit them. Render generates a new private `DJANGO_SECRET_KEY`; your existing account password still works, but existing Django admin cookies may need a fresh login.

For the genuine TMDB image mirror currently used locally, add `TMDB_IMAGE_BASE_URL` with its existing value from `backend/.env` if the default image server is unreachable from the hosting region. Do not use fabricated poster images.

Click **Deploy Blueprint**. The Docker build installs frontend/backend dependencies, builds React and collects Django admin assets. Startup runs existing Django migrations through the direct Neon URL and starts the server on Render's assigned port. No new database and no new administrator account are created.

## 3. Verify the public site

When Render says Live, open its actual HTTPS URL. Check the homepage and genuine posters, `/api/health`, login with the current account, adding/removing a watchlist film, logging a diary entry, and `/admin/`. Check mobile layout as well. If deployment fails, share the error text with credentials removed.

## What remains

- This setup must be deployed from your GitHub/Render accounts before a public URL exists. A locally tested container configuration is not a completed Render deployment.
- Free Render services sleep after inactivity, so the first visit can be slow.
- SMTP email verification/reset delivery is still a separate configuration task; it has not been enabled by this deployment preparation.
- Profile image records are stored in Neon by the current app. Render's temporary local filesystem is not used for persistent account data.
- For a custom domain, add it in Render and set `DJANGO_ALLOWED_HOSTS`, `CORS_ORIGINS`, and `APP_PUBLIC_URL` to include/use the final HTTPS domain.

References: [Render Blueprints](https://render.com/docs/infrastructure-as-code), [Blueprint fields](https://render.com/docs/blueprint-spec), [Free service limits](https://render.com/docs/free).


## Preparation checks completed

The React production build already passes. A local server was started with production settings and a Render-style hostname/HTTPS proxy. Homepage, built JavaScript, Django admin CSS, admin login and API health all returned HTTP 200. Secure cookies, same-origin CSRF handling, HTTPS redirects, rejection of unknown hosts, and unknown API 404 behavior passed. No test accounts were created for these checks.

Docker is not installed locally, so the multi-stage image itself has not been built here. Its first full build will run on Render. The Django deployment check leaves optional HSTS subdomain/preload policies disabled; these should be selected deliberately when configuring a final custom domain.
