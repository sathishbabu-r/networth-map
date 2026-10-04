# Huddle regression check — 4 October 2026

Scope: repair dated-action memory and directly related repeated action summaries. No additional MAP features, calculations, schema changes, or PRODUCT.md changes were made during this repair.

## Repair

An explicitly chosen action could remain only in the MAP draft list instead of becoming the active remembered Huddle action. A narrow AI extraction now checks the user's explicit commitment and date before saving the active action. When necessary, the Huddle snapshot reuses an amount already supplied in the MAP, without calculating a new amount or inventing its timing. Hypothetical actions remain unselected.

Action comparison now uses its text and date rather than JSON property order, preventing unrelated financial corrections from repeating action summaries. Choosing a replacement action clears the previous action's outcome.

## Results

- PASS: full automated suite, 27 Node tests and 68 Vitest tests (95 total).
- PASS: Convex compilation and Vite production build. Existing bundler warnings remain.
- PASS: automated logout/login and return-Huddle flow; saved action and date persist.
- PASS: real OpenAI conversation with an isolated temporary account, actual saves, a new authenticated session identity, and a real return conversation. Action: review current investment allocation; due date: 2026-10-10. Return answer: “Last time, you committed to reviewing your current investment allocation by October 10, 2026. What happened with that?”
- PASS: app opened and visually inspected in Chrome at http://127.0.0.1:5173/. Huddle retains one conversation with a bottom text composer, microphone and send button, and a discreet privacy link.
- NOT VERIFIED: human Google logout/login in the browser. Automated coverage and real backend session replacement passed, but they do not constitute a human Google sign-in check.
- NOT VERIFIED: live push-to-talk transcription. The user was asked for readiness to speak; no response was received during this check. Automated voice coverage passed but is not a live microphone test.

The isolated account and temporary internal test helper were removed. The OpenAI API key was not printed, logged or changed. Development backend updated; production was not deployed.

Overall verification is incomplete until the two human-assisted checks are performed.
