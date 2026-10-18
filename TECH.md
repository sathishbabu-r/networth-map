# Networth MAP / Money Huddle — implementation

Authoritative technical description · 10 October 2026. Strategy: [PRODUCT.md](PRODUCT.md). Screens: [DESIGN.md](DESIGN.md). [Change/gap register](docs/DOCUMENTATION_REVIEW.md) distinguishes local corrections from published evidence. This file describes existing code, not the full earlier intelligence specification.

## Architecture and ownership

React renders the client, Vite builds it, and Convex supplies the database, backend functions, authentication and static hosting. There is no second production database or app server. Agent and staticHosting are registered Convex components. AI uses the existing Convex gateway or server-side OpenAI connection; speech uses OpenAI transcription.

| Layer | Main source and responsibility |
|---|---|
| Entry/account | `src/main.jsx`, `route-entry.mjs`, `production-entry.jsx`; Convex client/auth provider, missing-connection message, local-origin correction and test-mode routing. |
| Workspace | `src/App.jsx`; authenticated state, save queue, proposal confirmation, Coach, account controls. |
| Journey | `src/NetworthMap.jsx`, `src/original-map/`; original assessment adapted to shared memory, completion gates and integrated check-in/progress. |
| Financial truth | `shared/map-schema.ts`, `map-engine.ts`, `financial-status.ts`, `networth-engine.ts`; validated memory, uncertainty and supported deterministic calculations. |
| Intelligence | `shared/intelligence.ts`, `convex/intelligence.ts`; routing, structured outputs, verification, CFO and immutable review persistence. |
| Conversation | `convex/coach.ts`, shared Coach/commitment/uncertainty helpers; single Agent-backed conversation and validated proposals. |
| Persistence | `convex/huddles.ts`, `schema.ts`, `validators.ts`; ownership, revision-checked writes and retained change history. |

Specialists are eight separately scoped structured calls through one backend Agent adapter, a wrapper around provider calls, not eight visible chatbots or independently deployed services. The CFO is a synthesis call; Coach is the existing conversational Agent. Ten role names do not establish ten independent models or superior reasoning.

## Data and revision contracts

`MapMemory` holds the current assessment step, typed financial/vision data, explored-section markers and estimate/unknown paths. A revision is the saved version number used to reject conflicting writes. Amounts are decimal strings in rupees; many dates and rates are optional strings. Existing age-based fields remain for compatibility with year-based UI. Collections are bounded to fifty entries. The MAP does not give every value full currency/as-of/range metadata.

Huddle content contains concern, structured facts, one active goal, one active action, one latest outcome and optional MAP. Structured facts distinguish exact/estimate/range/unknown, personal/business/shared scope, monthly/annual/balance period, INR and optional as-of description. An action contains text/due date; an outcome contains status, narrative, realised amount or null, result type and date. These are user reports, not externally verified transactions.

| Table | Stored purpose / index |
|---|---|
| Auth tables | Convex Auth users, accounts, sessions and tokens. |
| `huddles` | One current account record: content, revision, confirmation timestamp and legacy completeness flag; `by_user`. |
| `huddleChanges` | Old/new content for each successful save, revision/time and optional latest review reference; `by_huddle`. |
| `financialReviews` | User ID, MAP revision, structured JSON report string and created time; `by_user`. Reports are appended, not rewritten by later outcomes. |
| `evaluatorSessions` | Disposable user, created/expiry time and revoked flag; `by_user`. |
| `evaluatorLimits` | Expiring count by admission/user/operation/day key; `by_key`. |
| `productInsightEvents` | Assessment events, session, step, device class and validation code; account/session indexes. No financial answers attached. |
| `productFeedback` | Issue category, optional free text and clarity answer; account/session indexes. Free text can contain sensitive material despite UI guidance. |
| `completedMapEmailSignups` | Consented email, completion evidence and optional accepted/waitlisted consultation status; email/account/consultation indexes. No payment or scheduling record. |

Every save checks the authenticated account, validates content/MAP and compares expected revision. A conflicting tab is rejected. Review persistence also rejects a MAP changed while analysis ran. The frontend queues direct form saves and keeps failed edits pending. The legacy `huddles.complete` flag requires facts/goal/action; twelve-step availability instead checks assessment completeness. These are different concepts.

A review is stale when its MAP revision or financial-policy version differs. Coach receives only current matching review context. History references may point to the latest review even when later edits have changed facts; they document context, not causal influence.

## Eight specialists and selective context

Each request carries an ID, intent, focused/full context, revision, scoped packet, allowed role, schema, risk and timestamp. Role field allowlists send relevant facts/calculations/status. Unknown numeric fields become unavailable, rather than retained draft numbers. Only Behaviour receives the bounded deduplicated outcome history.

| Role | Scope / boundary |
|---|---|
| Income | Earning stability, concentration and capacity; excludes spending/debt strategy. |
| Spending | Recurring spending, intentionality and lifestyle changes; excludes diagnosis/debt strategy. |
| Cash Flow & Liquidity | Surplus, accessible cash and timing; excludes long-term asset strategy. |
| Assets | Liquidity, productivity and concentration; no security picks. |
| Liabilities | Costs, repayment and maturity; no refinancing/prepayment directives. |
| Financial Health & Risk | Cross-domain resilience; no final prioritisation. |
| Vision & Goals | User-stated aspirations and gaps; does not choose goals. |
| Behaviour & Mindset | Possibilities supported by reported history, with alternative explanations; no diagnosis or coaching conversation. |

Full review invokes all eight concurrently. Focused keyword routing selects fewer: earning→Income/Cash Flow; habits→Behaviour/Spending/Cash Flow; goals→Goals/Cash Flow/Assets/Liabilities/Risk; debt/high impact→Liabilities/Cash Flow/Assets/Goals/Risk; otherwise Spending/Cash Flow. This routes by keywords rather than a trained classifier.

The adapter uses configured reasoning/fallback models, defaulting in source to gateway `openai/gpt-4o-mini` or direct `gpt-4o-mini`; runtime configuration may differ. Each intelligence call has a 45-second timeout, one retry and bounded output. Concurrent failures are collected; conflicts trigger at most one recheck before CFO. The pipeline is synchronous, without a durable background workflow or result cache.

## Verification and Personal CFO

Structured schemas, which define permitted fields and types, validate role identity, lengths, finding IDs, evidence, confidence and escalation. Verification checks allowed fact/calculation references, duplicate finding IDs, supported numbers, explicit period/percentage/gross-versus-net/estimate meaning, unknowns, no-debt contradictions and incompatible included repayments. Behaviour findings require at least two distinct history references. This checks evidence linkage and explicit patterns; it does not prove semantic truth, behavioural causality or actual balances.

Matching-topic findings with different attention/no-action/uncertain positions trigger a bounded evidence challenge. Final states are RECONCILED, SCENARIO_DEPENDENT, INSUFFICIENT_DATA and ESCALATE; the richer earlier multi-stage state machine is a requirement, not a persisted implementation. Risk keywords classify low/medium/high; confidence thresholds are 0.6/0.8/0.95 with conservative caps for missing evidence, assumptions, rejection, failure or conflict. High-impact review escalates. Confidence is not calibrated probability.

The CFO receives verified findings/calculations and returns story, up to three supported insights, strategic gap, trade-offs, attention, no-action, optional behaviour, Coach questions, confidence and caveats. Its numbers and insight references are checked again. No fixed insight count is forced. Current missing-data explanations derive from actual fields; optional path/history gaps do not pretend supplied income is absent. Analysis failure/low confidence is explained separately. Professional escalation withholds specific prescriptions.

A stored report includes raw role results, verified findings, CFO, request question, revision/policy, timestamp, latency and invoked context categories. It has null decision/commitment placeholders, not a complete immutable Decision Ledger contract. Request/model/token/cost provenance and intervention acceptance/helpfulness are incomplete. No model superiority benchmark has been run.

## Coach and outcome learning

Coach receives current confirmed content, supported code calculations, current CFO context, MAP completion guidance, conversation messages and limited reviewed research records. It returns text plus a full proposed state or null. User text is treated as data. Existing policy wording is layered with newer rules, an ongoing maintainability concern.

The backend validates/preserves uncertainty, can extract an explicitly chosen action separately when an AI response left it only in MAP drafts, and requires review for inferred fields/new commitments/outcomes. Uncategorised Coach action drafts are mapped to existing Other Action. Historic blank-category actions are normalised for form compatibility without a database migration. The app alone applies accepted writes; a proposed/hypothetical idea cannot be treated as chosen.

No raw Agent messages are saved (`saveMessages: none`). Current-tab messages/drafts are transient. Outcomes remain in saved state/change history; review passes at most twenty recent history rows and deduplicates repeated action/outcome combinations. This is context-based adaptation, not model training or statistically validated outcome learning. Behaviour evidence and intervention options are bounded; rich commitment IDs/purpose/status history, exact intervention effects and causal attribution are unfinished.

Daily progress uses one latest report per action/date, preserving original change history. Loaded-history limits are visible. Action completion, realised result and changed balance are distinct; expense reduction and transferring the same money must not become two benefits. No automatic balance update follows an outcome.

## Financial correctness

Code computes assets minus personally borne liabilities, after-tax annual income, monthly Needs/Wants×12, repayments outside already included costs, surplus, cash after annual investing and selected lifestyle cost. Business ownership is equity share after business debt; underlying business assets must not be counted again. This rule relies on correct user entry.

Unknown is unavailable, explicit zero is zero, and estimates propagate only to dependent metrics. Zero denominators suppress ratios. Included repayments above annual household Needs are contradictory: affected cash flow is withheld while independently supported balances remain. Interest from current balance×rate is an estimate. Accessible months uses current lifestyle costs and is not a comprehensive debt-inclusive runway. Ratios/compounding/goal-gap/scenario helpers exist, but richer validated scenarios are not fully integrated into the customer journey.

The currency UI preserves up to two decimal places and rejects negative/non-money text rather than stripping its meaning. Existing records already corrupted by the older parser cannot be automatically reconstructed; users must review original amounts. `CONFIRMED_AMOUNT` means user-supplied, not externally audited. Coach prose is prompt- and selected-claim-guarded, not subjected to every CFO numeric check.

## Authentication, evaluation and privacy

Convex Auth keeps Google and a distinct anonymous evaluator provider. Financial access derives identity on the server; public reads/actions do not accept arbitrary user IDs. Google sign-in HTTP cookies use the existing first-party proof/expiry handling. Local Google flow uses the configured `127.0.0.1:5173` origin. Normal auth storage and `/try` tab-scoped evaluator storage use separate namespaces; copied tabs can still copy credentials.

Evaluator access needs an enabled flag and future deadline bounded to seven days. Sessions end after four hours or that deadline. Admission is capped at three/minute and thirty/day. Per session: two reviews, fifteen Coach requests, three hundred saves and five hundred telemetry events; minute/global limits also apply. Speech and email contact require Google. Expired/missing disposable accounts cannot use financial functions; scheduled batched cleanup deletes disposable product records, auth tokens/accounts and user. Cleanup can lag expiry. Limits can be exhausted by abuse; no IP challenge exists. Configuration deadlines in old release reports are historical, not an evergreen promise.

Specialist contexts are minimised; Coach receives broader confirmed account context. Financial answers go through Convex and AI; audio bytes go through Convex to OpenAI `whisper-1`, with a size bound and timeout. The app does not deliberately persist raw audio/full transcripts, but account facts, prior versions, reports, feedback and optional email persist. Provider retention has not been verified; do not promise zero retention or end-to-end encryption.

Export downloads current content, full paginated history, product extras and reviews as JSON. Product deletion removes the current MAP then schedules batched history/review/extra removal; normal identity/auth records are not deleted by that control. Provider copies are not controlled by app deletion. This is not legal/privacy certification. Existing contact links open external destinations only when the user chooses them; no new adviser sharing or notifications exist.

## Testing and deployment

Use the existing commands from `/Users/admin/build-sprint-app`:

```sh
npm run dev
npm run typecheck
npm test
npm run build
npm run deploy
```

`dev` keeps the development Convex functions in sync before starting Vite. `test` combines Node tests and Vitest, including financial semantics, backend ownership/revisions, evaluator expiry/limits, Coach schemas/proposals and UI flows. Mocked transports prove their specified behaviour, not live AI quality or Google OAuth. No lint script is configured.

`npm run test:browser` runs isolated reset-on-reload sample services. `npm run dev:test` runs explicitly enabled local testing with its own adapter. These are not production connections. Test mode is rejected during build/deploy by the guard and predeploy check.

`npm run deploy` builds with the production Convex URL, publishes the backend and uploads static assets to the existing `.convex.site` host. GitHub push does not deploy. The published address is `https://lovely-lapwing-356.convex.site/`; development is separate. Preserve existing account data/configuration and never replace the required stack.

Historical release proof: 225 tests, typecheck/build and scoped live synthetic evaluator checks in [release report](docs/validation/EVALUATOR_RELEASE_REPORT.txt). The later [audit](docs/validation/USER_FLOW_AUDIT.md) found material defects despite those passes. This conversation also confirmed production landing after hosting deployment `935d694b-2ec5-4718-969c-288d2b0095e6`; no full new production journey was checked. Current fix checks: 235 tests, typecheck/build and development backend push passed. These fixes were subsequently published on 10 October 2026 via `npm run deploy`, hosting deployment `9a646bf8-4e3b-4a19-a90f-23ad98f19622`; the live landing page rendered in Edge and the served HTML matched the new build. A fresh complete production journey remains unchecked. A direct real-provider synthetic smoke returned all eight roles plus CFO, one evidence-linked insight and accurate missing sections; it does not test deployed Agent/auth or establish usefulness. Details and artifacts belong in the change register. Provider-backed review usefulness, fair blinded comparison, human pilot results, live Google recheck, long-lived expiry/cleanup, real mobile keyboard/accessibility and costs remain unproven.

## Reference map

Architecture records [001–006](docs/adr/001-canonical-map.md) explain original trade-offs; inspect each against current code. [Earlier intelligence specification](docs/reference/PRODUCT_INTELLIGENCE_SPEC_2026-10-07.md) preserves unmet requirements. [Intelligence status](docs/INTELLIGENCE_STATUS.md), [evaluation protocol](docs/validation/REAL_AI_VALIDATION.md), [research audit](docs/RESEARCH_AUDIT.md), [Coach framework](docs/COACH_FRAMEWORK.md) and [Google setup](docs/GOOGLE_SETUP.md) remain useful dated references. Their earlier environment/deployment statements do not override newer observed release evidence.
