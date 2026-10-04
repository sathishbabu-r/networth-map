# Networth MAP + Money Huddle

Updated: 4 October 2026.

Live application: https://lovely-lapwing-356.convex.site

This document describes the current product and its agreed boundaries. It replaces the earlier Huddle-only description. The approved expansion is recorded in [MAP_HUDDLE_SCOPE.md](docs/MAP_HUDDLE_SCOPE.md).

## The job

Help a person understand their financial position, define what they want, and choose a practical next action.

The method remains:

**Blueprint → Vision → MAP**

- **Blueprint:** Understand where you stand today.
- **Vision:** Understand where you want to go.
- **MAP:** Assess the actions that could move you towards that vision.

Networth MAP provides the structured assessment. Money Huddle provides a conversation alongside it, helping users explain their answers, clarify missing information, choose a goal and follow through.

## The user

The initial pilot user is **Ratheesh**, a business owner whose income, assets, loans, expenses and family commitments are spread across different places.

The welcome screen introduces a guided 20-minute financial clarity assessment. Exact figures, best estimates and unknown information must remain distinguishable. Users should not need perfect records to begin.

The original Money Huddle pilot target remains a useful conversation leading to one chosen goal and one dated action within 15 minutes. This is a validation target, not a measured result.

## Product identity

The application is called **Networth MAP**.

Welcome heading:

> Your wealth. Your vision. Your next move.

Welcome description:

> Know your wealth. Define your vision. Make your next move with clarity.

The conversational companion is called **Money Huddle**. Its tagline remains:

> Your Vision. Your Wealth. Your Next Move.

Preserve the existing colours, typography, assessment content and MAP methodology. Authentication fixes do not authorise a redesign or additional features.

## First visit and Google sign-in

A new visitor uses the published production address, rather than localhost.

1. Open the welcome screen.
2. Click **Build My Networth MAP** to start Google sign-in.
3. Choose an account and complete Google's sign-in process.
4. Return to the welcome screen, now signed in.
5. Click **Build My Networth MAP** to open the assessment introduction.
6. Click **Start My Blueprint** to reach the first assessment question: **What income do you take home?**

Signing in must not automatically open the assessment. The visitor chooses when to start.

The primary button keeps its name while sign-in starts; it does not display “Opening Google…”. Google account selection and consent still happen on Google's own page.

A returning user with a saved MAP sees **Continue My MAP**. Returning to the welcome screen during a visit must preserve the current assessment and conversation draft.

If Google sign-in is unavailable, show the explanation immediately underneath the primary control:

> Google sign-in is temporarily unavailable. Please try again shortly.

A sign-in failure must provide a nearby retry message rather than leaving a disabled button unexplained.

## The assessment

Preserve the original Networth MAP assessment, including its twelve screens, input choices, validations, calculations, findings, action assessments, sharing and print output.

The financial journey covers Earn, Own, Owe, Spend and Invest, then vision, lifestyle, goals, milestone and proposed actions.

The account remembers assessment entries and progress. Missing values must not silently become zero. Estimates and unknown information remain visible.

## Money Huddle

Users can type or use push-to-talk, which records only while they deliberately activate the microphone. Spoken answers are transcribed into text that users can review or edit.

Money Huddle asks one useful question at a time. It uses remembered financial context instead of repeatedly asking for information already provided.

The conversation should help the user:

- Understand the current issue and relevant financial facts.
- Clarify missing or ambiguous information.
- See a formula-based observation when the available figures support it.
- Choose one goal and one practical, dated action.
- Return to report what happened and decide their next step.

The user chooses the goal and action. The agent does not make financial decisions on their behalf.

The current application includes controls to open and minimise Money Huddle. This documents existing behaviour; further changes to its presentation require approval.

## Saving and correcting information

Assessment entries are remembered in the signed-in account as the user works.

In conversation, proposed changes to financial amounts are shown for **Confirm** or **Edit** before they are saved. Goals, dated actions and other supported context updates are remembered without an additional financial review card when no financial amount changes require review.

Users can correct remembered information through conversation. Saved changes have a revision history. Full conversation history and raw audio are not retained by the application.

## Financial rules

Financial calculations use defined formulas rather than invented AI arithmetic. Users must be able to understand how a displayed number was calculated.

Keep these separate:

**Facts → Calculations → Observations → User decisions → Actions → Outcomes**

For example, ₹5 lakh overdue out of ₹8 lakh in receivables supports a calculation of **62.5% overdue**.

Completing an action does not automatically prove a financial improvement. Calling a customer, receiving money and updating an account balance are separate events.

Avoid double counting: reducing an expense by ₹2,000 and saving the same ₹2,000 is one ₹2,000 benefit.

Preserve all existing MAP formulas, action assessments and financial logic. Do not add investment recommendations or autonomous financial decisions.

## Returning and daily progress

When a saved action exists, Money Huddle follows up on that commitment and asks what happened. Users may also bring a new concern.

Daily progress distinguishes action completion, reported outcomes and explicitly reported financial updates. It does not automatically reduce balances or claim realised benefits from an action alone.

One active dated action is supported, with previous changes and reported results available in remembered history.

## Privacy and account controls

Convex stores account information and financial context. The AI provider processes conversation inputs. OpenAI processes voice recordings into text.

Explain processing before the first conversation. Application retention and provider retention are different; provider retention has not been verified, so do not promise that providers retain nothing.

Users can export their remembered information and delete their saved MAP, snapshot, goal, action and related history.

Usage events, feedback and an optional email after the result support product learning. Financial answers remain private to the authenticated account.

API keys and other secrets belong in Convex environment variables. They must not appear in product documentation, browser code or GitHub. `.env.local` remains git-ignored.

## Production authentication and hosting

Convex provides the database, backend, authentication and static hosting. Publishing uses **npm run deploy**; pushing code to GitHub does not deploy the app.

Production Google OAuth configuration:

- **Authorized JavaScript origin:** `https://lovely-lapwing-356.convex.site`
- **Authorized redirect URI:** `https://lovely-lapwing-356.convex.site/api/auth/callback/google`

Required production environment variable names:

- `JWT_PRIVATE_KEY`
- `JWKS`
- `SITE_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

`SITE_URL` must be exactly `https://lovely-lapwing-356.convex.site`. Preserve the separate working development configuration.

The mobile Safari fix preserves the temporary sign-in proof when Google returns to the application. It does not bypass Google authentication or change financial behaviour.

## Verification status

The builder has reported that Google sign-in works on laptop and mobile. The latest change removes the automatic assessment start and the “Opening Google…” button text.

Automated checks pass, and the deployed welcome screen loads with an available start button. The latest post-login change still needs a repeat check in a fresh private Safari session; this document does not claim that check is complete.

The full acceptance check is the real published journey on desktop and mobile:

**Welcome → Google sign-in → successful authentication → available start button → explicit start → first assessment question.**

## Commercial validation

The original proposed offer is **₹999 for one month of Money Huddle check-ins**. Payment is a planned commercial test, not an implemented payment flow.

The pilot should establish whether Ratheesh can finish independently, complete a chosen action within seven days and pay to continue. These outcomes have not yet been established.

## Boundaries

Do not add bank connections, automatic account aggregation, document uploads, reminders, continuous listening, spoken AI responses, investment recommendations or autonomous decisions without approval.

The immediate priority is a reliable first-visitor production journey. Further product improvements are paused until approved.
