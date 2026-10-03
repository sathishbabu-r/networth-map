# My Money Huddle — V1 test report

Status: implemented and checked locally; real provider connections and production release are still pending.

Scope: conversational Huddle, typed/push-to-talk answers, confirmed financial snapshot, one deterministic insight when supported, one chosen goal, one dated action, saved user-specific context, return Huddle and confirmed outcome. Payment remains deferred by the builder's instruction.

## Passed

- `npm test`: 28 automated checks (18 financial/confirmation/recording/provider-error checks, 5 Convex data-access checks, 3 interface flow checks and 2 speech-action checks).
- `npx tsc --noEmit -p convex/tsconfig.json`: backend type checking.
- `npm run build`: frontend production build.
- `npx convex dev --once`: backend compiles and uploads to the existing development deployment.
- `npm audit --omit=dev`: no reported production dependency vulnerabilities.
- Real Chrome browser at `http://127.0.0.1:5173/`: sign-in screen, connection notices and privacy disclosure render; no captured console errors.
- Live backend rejects an unsigned coach request and does not disclose a saved Huddle.

The interface flow test covers simulated Google sign-in → chat → review without automatic saving → confirmation → 62.5% receivables calculation → user-selected goal → dated action → simulated logout/login → remembered commitment. A second test corrects a proposed amount, preserves it after a failed save and confirms the corrected amount on retry. Data-access tests run the actual Convex handlers using simulated identities and a test database: one user cannot see, overwrite or delete another user's Huddle; a new session for the same user retains the confirmed context; stale tabs cannot overwrite newer confirmations. Voice tests simulate recording and OpenAI responses, including missing setup, retry, access restrictions and invalid recordings.

## Not yet verified

These automated tests are not proof of real Google authorization, AI conversation quality, real microphone transcription, a real logout/login round trip, the ≤15-minute independent pilot, or production hosting.

The Google and OpenAI credentials are now configured; the development setup reports `google: true`, `coach: true`, `speech: true`. The builder completed real Google login, and the signed-in conversation screen was inspected in Chrome. These flags indicate configuration, not successful AI requests.

A real fictional coach request failed. A minimal backend OpenAI request returned HTTP 429 with code `credit_balance_exhausted`: the OpenAI organization's API credit balance is exhausted. No confirmed financial snapshot was saved during these checks. The error handling now distinguishes this billing condition from temporary request limits without exposing the key, request headers or financial conversation. Real coach, push-to-talk transcription, logout/login with confirmed context and production deployment remain pending API credit and the remaining browser checks.

Signing keys and the local `SITE_URL` are configured in the development deployment. No provider secrets are committed to the repository. Raw audio and full conversations are not saved in the app database; only reviewed, confirmed context and its change history are saved.

Production has not been published. The builder requested deployment only once the complete real flow works; that condition has not been met.

## Next check after setup

Use a fictional receivables example: current business receivables ₹8 lakh, overdue ₹5 lakh. Confirm both estimates and timing, inspect 62.5% and its formula, choose a ₹3 lakh collection goal and an action with a specific date. Include one spoken answer and correct its transcript before sending. Log out, log back in and confirm that the agent remembers the commitment. Record a fictional collection separately from action completion and confirm it. Check a second account cannot see the first account's context.

Then configure the same required secrets and fresh signing keys in production, set production `SITE_URL` to its real `.convex.site` address, add its Google callback URL to the Google client and run `npm run deploy`. Repeat the complete browser check against the returned live URL.
