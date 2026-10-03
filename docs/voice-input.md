# Voice input

Voice input adds editable Polish transcription to `/match`, the idea wizard, the conversation composer and the new-message form. Typing and existing validation remain available. Dictation never submits a form, starts matching or sends a message.

## Server contract and limits

`POST /api/transcribe` accepts `multipart/form-data` with one `audio: File`. Success returns `{ "text": string }`; errors return `{ "error": string }` with Polish recovery copy. Statuses: 400 for missing, empty, duplicate or malformed uploads (including upload timeout), 413 for oversized uploads, 415 for unsupported content, 429 for rate limits with `Retry-After: 60`, and 503 for unavailable configuration or failed transcription. Cross-origin browser uploads are rejected.

The file limit is 2 MiB. The entire multipart body has a separate 2 MiB + 16 KiB cap, checked while reading the stream, regardless of Content-Length. Reading is cancelled after 10 seconds. Hosting providers can impose a smaller limit or buffer requests before application code runs; enforce ingress limits on the hosting layer too.

The browser selects WebM/Opus first, then MP4, using `MediaRecorder.isTypeSupported()`. Upload names use `.webm` or `.m4a` based on the actual recorder MIME type. The server checks MIME together with WebM EBML/DocType/Opus markers or MP4 ftyp/brand bytes, then supplies its own filename. These are container signature checks, not full codec decoding; corrupt payloads can still be rejected by the transcription provider. Ogg-only recording implementations use the keyboard fallback.

The prototype reuses `src/lib/rate-limit.ts`: five attempts per minute per client IP and a global ceiling of 60 attempts per minute. Both in-memory limits are **per server instance**, reset on restart, and do not provide a deployment-wide quota. The host must supply a trustworthy, overwritten `x-forwarded-for` header. Missing IPs share the `unknown` bucket. Production needs a shared limiter and ingress abuse protection.

`src/lib/ai/transcribe.ts` is server-only. It uses the existing `OPENAI_API_KEY`/`hasOpenAI` configuration, `TRANSCRIPTION_MODEL = gpt-4o-mini-transcribe`, language `pl`, and a 20-second request timeout. It returns the provider's words unchanged, with no rewriting prompt. Transcripts are plain user field content, never application instructions. No fictional transcript is returned when configuration or the provider is unavailable. Audio, transcripts and credentials are never logged by this feature.

## Browser lifecycle and privacy

The microphone is requested only by the explicit start button. A clip stops at 60 seconds. Stop collects the final dataavailable event before creating the file, releases all tracks and uploads. Cancel discards the clip, aborts a pending upload and ignores stale responses, including permission results arriving after cancellation. Unmount releases tracks, timers and requests. Cancelling the browser request cannot guarantee that a provider request already received by the server is stopped.

Before recording, the interface explains that audio is sent to OpenAI for transcription. HubMI does not persist recordings in Supabase, application storage or localStorage. The provider's handling and retention depend on the applicable account configuration and policy; no claim is made that OpenAI never retains audio. Accepted transcript text becomes normal form content and follows the existing draft/message storage flow only when the user saves or sends it.

Transcripts append to the current field, including edits made during processing, with a newline where needed. Limits remain 2000 for match and idea text, 160 for idea title, 120 for municipality and 4000 for messages. If appending would overflow, the original field is preserved and the full transcript appears in a separate editable area for shortening and copying. No silent truncation occurs.

Controls use Button, Heroicons and theme tokens, visible text, polite live announcements, visible keyboard focus and targets of at least 44 px. HTTPS is required in deployment; localhost works in development.

## Validation on 2026-10-03

- Node 22.23.3: `npm run format`, `format:check`, `lint`, `typecheck`, `test` (56 files, 519 tests) and `build` pass after syncing the latest main.
- Automated Vitest coverage mocks recording APIs and provider calls: upload rejection before transcription, streamed body limits, rate limiting, configuration/provider failures and timeout, permission denial, unsupported formats, manual/automatic stop, cancellation in recording/transcription/permission stages, track/timer/request cleanup, duplicate operations, stale responses, empty transcription, field edits and overflow, live announcements and non-submitting controls. Each form has integration coverage.
- Chrome 154.0.8037.58: native MediaRecorder with the browser's synthetic microphone, WebM/Opus uploads, keyboard start/stop, preservation of typing during processing, and no automatic submission. HTTP transcription was mocked; no paid provider call was made. [Machine-readable results](screenshots/voice-input/validation.json).
- Playwright Firefox 155.0: native MediaRecorder with a synthetic microphone, WebM/Opus upload and insertion. Its recorded 13881-byte clip was separately accepted by the actual application upload validator. HTTP transcription was mocked. [Results](screenshots/voice-input/firefox-validation.json).
- `/match` at 320 px with A++ in default and high contrast: document width stays 320 px; axe reports zero WCAG 2.1 A/AA violations. Screenshots were visually inspected.
- Edge is unavailable in this environment. Real mobile Safari, physical microphone speech, live OpenAI transcription and assistive-technology announcements have **not** been verified. Safari's MP4 path has signature/MIME unit coverage, but requires a real device check. Complete those checks before calling cross-browser dictation fully verified.

## Screenshots and demonstration

The following show the real component with synthetic microphone audio and explicitly mocked HTTP responses, not a production fallback:

- [Recording](screenshots/voice-input/recording.png)
- [Processing](screenshots/voice-input/processing.png)
- [Success](screenshots/voice-input/success.png)
- [Unavailable transcription](screenshots/voice-input/error.png)
- [320 px, A++](screenshots/voice-input/320-a-plus-plus.png)
- [320 px, A++, high contrast](screenshots/voice-input/320-a-plus-plus-high-contrast.png)
- [Demonstration recording](screenshots/voice-input/demo.webm)

## Shared files and contracts

The only new HTTP contract is `/api/transcribe`; existing API response shapes, database schema and form validators are unchanged. Existing shared files touched: `src/lib/ai/models.ts`, `src/components/match/match-form.tsx`, `src/components/ideas/idea-wizard.tsx`, `src/components/messages/messages-workspace.tsx`, `src/components/messages/new-message-form.tsx` and README. The limiter is reused without changing its contract. New reusable modules live in `src/lib/voice/` and `src/components/voice/`; the server service lives in `src/lib/ai/transcribe.ts`.

References: [OpenAI file transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), and the installed Next.js Route Handlers guide in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
