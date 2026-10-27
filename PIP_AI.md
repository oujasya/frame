# Pip conversation setup

Pip now uses OpenAI's Responses API from Django. Typed messages are sent to `/api/pip/chat`, with the last ten eligible chat turns, current movie ID and spoiler setting. The assistant can greet people, follow a conversation, explain films and use read-only TMDB search/detail tools. Movie cards come from TMDB, never invented model IDs.

## Private configuration

Set `OPENAI_API_KEY` in the Render service's Environment settings. Do not put it in GitHub, browser code, a `VITE_` variable or screenshots. `OPENAI_MODEL` defaults to `gpt-5.4-mini` and can be changed to a supported model available to the owner account. API usage requires OpenAI API access/billing; a ChatGPT subscription does not supply API credit. No paid plan upgrade or credit purchase is performed by this app.

The key is used only in a server-to-server Authorization header. Provider error bodies are never returned to the browser. Without a key the status endpoint reports not ready, and chat returns a structured 503 rather than claiming to generate AI replies. Movie shortcuts still work.

## Chat behavior and data

- Hi/hello, follow-up questions and film discussion go to the model instead of the old keyword matcher.
- Context stays in memory for the current browser session; New chat clears it, and account changes reset it. FRAME does not store chat messages in PostgreSQL or localStorage.
- Chat requests use `store: false`. Messages are still processed by OpenAI under its applicable data policies; this is not a promise of zero provider retention.
- The UI explains that messages go to OpenAI. Private diary entries, profile details and saved watchlists are not automatically sent to it. The watchlist picker remains a local shortcut.
- A current movie is fetched server-side from TMDB. Metadata is treated as untrusted data, with no ability to execute app/account actions.
- Spoilers are off by default. The instruction asks the model to avoid major spoilers until the user enables them; this is a model instruction, not a guaranteed content filter.
- Replies may be incorrect. TMDB facts are distinguished from plot interpretations and general model knowledge.

## Bounds and controls

Each request accepts at most 12 user/assistant messages, 2,500 characters per message, and 14,000 characters total. It permits at most three model turns and three read-only movie lookups, with 1,000 output tokens per turn and a bounded request deadline. Chat is CSRF protected and limited to 8 requests per minute and 60 per day per account/IP. Limits use Django's current in-memory cache and reset with process restarts; configure a shared cache for multiple workers. These limits are not a billing hard cap—configure appropriate API project limits as well.

The frontend provides retry, Stop, New chat, context labeling and spoiler controls. It cancels old requests and prevents stale replies from crossing account changes. Its timeout still works when Pip supplies an external cancellation signal.

## Verification

11 isolated backend tests cover greetings, history, spoilers, trusted server movie context, tool cards, invalid input, missing keys, CSRF, throttling, network/provider errors and empty replies. Two frontend regression checks verify timeout and user cancellation reach the actual fetch. The React production build passes. Real OpenAI inference is checked separately after the owner-supplied key is saved in Render; mocked tests do not prove billing/model access.

References: [Responses API conversation state](https://developers.openai.com/api/docs/guides/conversation-state), [API setup](https://developers.openai.com/api/docs/quickstart), [configured default model](https://developers.openai.com/api/docs/models/gpt-5.4-mini).
