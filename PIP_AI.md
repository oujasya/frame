# Pip AI — Gemini connection

Pip defaults to Google Gemini (`gemini-3.5-flash-lite`). Set `GEMINI_API_KEY` privately on the backend or in Render environment settings. Never put it in frontend variables or Git.

`PIP_AI_PROVIDER=gemini` is the default. OpenAI is only used if explicitly selected; there is no paid-provider fallback. Gemini has a limited free tier. Keep the Google project on the free tier; this app cannot enforce the provider account billing settings. Free-tier prompts and replies may be used by Google to improve products. Do not include sensitive information.

Pip supports greetings, follow-up conversation, spoiler controls, current-film context, and read-only TMDB search/details. Chat history stays in the current browser chat session and is submitted to the selected provider with each request. Private diary/watchlist records are not sent automatically. Requests are bounded and rate-limited. Quota or access errors are shown honestly without canned AI answers.

Run `python manage.py test core.test_pip core.test_gemini` and `npm run build` in frontend. Provider integration tests mock external APIs; a real deployed greeting and movie lookup must also pass before claiming the live connection works.
