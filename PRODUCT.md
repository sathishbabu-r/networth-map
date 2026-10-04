# Networth MAP + Money Huddle

Updated: 4 October 2026.

Live application: https://lovely-lapwing-356.convex.site

This document describes the current product, its agreed boundaries and explicitly marked requirements that are not yet implemented. It replaces the earlier Huddle-only description. The approved expansion is recorded in [MAP_HUDDLE_SCOPE.md](docs/MAP_HUDDLE_SCOPE.md).

## The job

> When my daughter's school fees are due and I need to arrange the money, I want to know what money I can actually access before the deadline and how I will cover any shortfall, so I can get the fees paid on time without creating another financial problem.

The method remains:

**Blueprint → Vision → MAP**

- **Blueprint:** Understand where you stand today.
- **Vision:** Understand where you want to go.
- **MAP:** Assess the actions that could move you towards that vision.

Networth MAP provides the structured assessment. Money Huddle provides a conversation alongside it, helping users explain their answers, clarify missing information, choose a goal and follow through.

## School-fees completion rules

Agreed on 4 October 2026. These are product requirements, not a claim that the dedicated funding flow or its statuses are already implemented. They supersede “one goal + one action” as the completion measure for this use case.

### Huddle completion: a viable funding plan

Start with:

> School fees are due and I don't know how I'm going to arrange the money.

The immediate outcome is:

**Amount due → Deadline → Available cash → Expected-but-unconfirmed cash → Other commitments → Funding gap → Chosen funding action**

The user should know what is due, when it is due, what money is actually accessible before that date, which receipts remain uncertain, what other commitments compete for that cash, and what action they will take to close the gap.

Do not count inaccessible assets or expected-but-unconfirmed receipts as available cash. Account for other commitments when establishing what cash is available for the fees.

Illustrative example supplied by the builder; these are not Ratheesh's verified figures:

- School fee: ₹3 lakh, due Friday.
- Accessible cash before Friday: ₹1.5 lakh.
- Expected customer receipt: ₹1 lakh, not guaranteed.
- Gap against confirmed accessible cash: at least ₹1.5 lakh; other commitments may increase it.
- Chosen action: Call Ravi today to arrange ₹1.5 lakh.
- Repayment terms: to be confirmed.

### Focus on the present issue; complete the MAP progressively

Agreed rule: the user does not have to complete the full Networth MAP before working through the school-fees need. Huddle asks only for information necessary to understand this issue, establish the funding gap and test the chosen plan.

Huddle both challenges assumptions and guides the user towards a practical next step. Help them organise what is known, identify gaps, compare the options they raise, and choose a specific action and date. Explain supported calculations and trade-offs clearly; do not invent funding sources, guarantee approval or make the choice for them.

Use useful questions to challenge assumptions without making the decision for the user. For example:

- Is that money actually accessible before the school-fees deadline?
- What other payments must that same money cover?
- If the expected receipt or future loan does not arrive, how will you repay your friend?
- What repayment terms have actually been agreed, and what remains unknown?

These are examples, not a fixed questionnaire. Ask one relevant question at a time and use answers already remembered in the MAP.

Continue encouraging the user to complete and update the wider MAP over time, without delaying the immediate plan for unrelated assessment sections. Missing information material to the plan must remain visible; do not claim the plan is viable when a necessary funding or repayment assumption is unresolved.

### Current answer flow: ask, answer, Send

Updated on 4 October 2026. This replaces the earlier confirmation-card requirement and the proposal to display insights during MAP building.

Ask one relevant question. The user types an answer or reviews and edits a voice transcript, then presses Send. The first answer sends without a “Before we talk” popup; processing information remains available in Privacy & data. Sending remembers explicitly supplied information; there is no extra Confirm/Edit button or insight card in Huddle. Clarify material ambiguity before updating rather than inventing an interpretation. Users can send a correction later. If saving fails, retain their answer and show the error so they can retry.

Once the MAP is complete, the proposed repository-backed comprehensive action plan remains a later requirement, not a claim of implementation. Keep its guidance separate from user facts and preserve existing calculation rules.

### Borrowing and unresolved repayment risk

Ratheesh may accept borrowing terms because the fees are urgent, repay his friend later using a home-loan top-up or personal loan, and seek a higher-interest loan from a non-bank lender if a bank declines. These are possible choices described by the builder, not recommendations or confirmed approvals.

Agreed rule: Huddle must show the repayment risk and keep it unresolved even if he chooses to proceed. Acceptance of terms does not establish that repayment is affordable. A hoped-for future loan must not be treated as approved funding or a confirmed repayment source.

Record any known repayment amount, interest, due dates and proposed repayment source. Keep missing terms and unapproved funding visibly uncertain. The user chooses whether to proceed; Huddle must not mark the repayment risk resolved merely because they accepted it.

Track fee payment separately from repayment risk. “Fees paid” can be recorded when the user confirms payment, while the borrowing obligation and repayment risk remain open. Do not claim “without creating another financial problem” solely because the fee was paid.

Until funding availability and repayment terms are clarified, the plan remains provisional rather than a demonstrated viable funding plan.

### Financial completion: follow through to payment

Track the open need through:

**Need identified → Plan chosen → Action taken → Funding confirmed → Money received → Fee paid**

A conversation ending does not close the financial need. Arranging funding is a milestone; the school-fees job is complete only when the school has received the required payment.

At the next Huddle, ask whether the planned money arrived. If it has not arrived, keep the need open. If it has arrived, clarify whether it is a loan, gift or another source, propose the appropriate MAP updates, and capture any repayment obligation. The user reviews or edits their answer and sends it; there is no separate financial confirmation card.

This is follow-up within a returning Huddle, not approval to add automatic reminders or messages.

### Rule: never confuse a plan, promise or action with a financial outcome

| User statement | What it establishes |
| --- | --- |
| “I'll call my friend.” | A commitment. |
| “My friend agreed.” | Expected funding; no receipt yet. |
| “₹1.5 lakh reached my account.” | Money received, as reported and confirmed by the user. |
| “The friend expects repayment.” | A liability whose amount and terms must be captured. |
| “School received ₹3 lakh.” | The fee-payment outcome, if it covers the amount due. |

User-confirmed outcomes are not independently verified bank or school transactions. Partial funding or partial payment must not mark the whole need complete. Preserve the distinction between source promises, receipts, liabilities and payment; do not double count the same money.

## The user

The first person we serve is someone with an expense coming due who needs to arrange money, has financial information scattered across different places, and keeps postponing a review.

The initial pilot user is **Ratheesh**. The builder confirmed an actual occasion: his daughter’s school fees were due, and he would call his friend to arrange the money.

He has also asked his family to review his spending and reduce expenses. He feels restless about spending more than his income for a few days, then gets on with his routine.

**How he wants to feel:** Relieved that they’ve arranged the money for their daughter’s school fees.

This is the first situation to validate. It does not establish that the product has helped him arrange money or guarantee that it can do so.

The welcome screen introduces a guided 20-minute financial clarity assessment. Exact figures, best estimates and unknown information must remain distinguishable. Users should not need perfect records to begin.

The original general Money Huddle pilot target was one chosen goal and one dated action within 15 minutes. For the school-fees use case, the completion rules above require a viable funding plan, followed separately through to fee payment. Neither completion nor the time target has been measured.

## What the product replaces

In the confirmed school-fees situation, Ratheesh calls a friend to arrange money. For reviewing spending, he asks family members to help, or postpones the review as his routine takes over.

The broader alternatives identified for the product are spreadsheets or Excel, scattered bank and investment statements, WhatsApp notes, conversations with a CA, spouse or adviser, and mental tracking. These have not all been confirmed as Ratheesh’s own habits.

Networth MAP should reduce the effort of gathering and understanding this information. Money Huddle supports reflection and follow-through; the user remains the decision-maker.

## Why the user starts — and why they hesitate

**What is going wrong now:**

> My financial information is scattered. I know there are things I should act on, but I don't have one clear picture or a simple way to know what to do next.

**The risk they feel in trying the product:**

> This is going to take too much time, I won't have all the numbers, and I'm not sure I want an AI making decisions about my money.

These are product hypotheses to validate with pilot users, rather than findings from completed research.

## How the product responds

| User problem | Product response |
| --- | --- |
| Financial information is scattered. | Networth MAP brings it into one financial picture. |
| Getting started feels like work. | An assisted first MAP accepts estimates and “I don't know”. |
| The user does not know what matters next. | Money Huddle uses the MAP and supported insights for a contextual conversation. |
| The user keeps postponing action. | Huddle helps them choose one small, specific, dated action. |
| The user forgets or struggles to follow through. | The next Huddle remembers the commitment and asks what happened. |
| The MAP becomes outdated. | The user can update it through conversation: the user edits and sends an answer or correction, then the MAP updates. |
| The user does not trust AI with money. | AI does not make decisions for them. Only explicitly supplied information is remembered; ambiguity prompts a question, and calculations remain transparent. |

Sending an answer is the user’s saving step. Direct assessment entries are saved as the user makes them; corrections remain available.

## The worry onboarding must remove

> I don't have all my financial information ready — can I still start?

The product's answer should be immediate:

> Yes. Start with what you know. Estimates are fine, and you can complete and update your MAP over time.

This is the agreed onboarding promise. Recording it here does not change the current screen copy or approve a redesign.

## Product identity

The application is called **Networth MAP**.

Welcome heading:

> Your wealth. Your vision. Your next move.

Welcome description:

> Know your wealth. Define your vision. Make your next move with clarity.

The conversational companion is called **Money Huddle**, represented by a rose-gold diamond icon with a subtle sparkle. Its tagline remains:

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
- Continue with one useful question without displaying an insight card during answer collection.
- Choose one goal and one practical, dated action.
- Return to report what happened and decide their next step.

The user chooses the goal and action. The agent does not make financial decisions on their behalf.

The current application includes controls to open and minimise Money Huddle. Its chat panel has a translucent glass background with light blur so the MAP remains partly visible behind fully readable chat text and controls. Browsers without background-blur support use an opaque background. This documents existing behaviour; further changes to its presentation require approval.

## Saving and correcting information

Assessment entries are remembered in the signed-in account as the user works.

In conversation, the user reviews or edits their answer before Send. Sending remembers explicitly supplied financial answers, goals and actions without a separate confirmation card. Ambiguous information needs a clarifying question before an update.

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

Explain processing in the accessible Privacy & data section without an interrupting first-message popup. Application retention and provider retention are different; provider retention has not been verified, so do not promise that providers retain nothing.

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

## Local browser verification without a user login

Run `npm run test:browser` to open a separate sample-data preview at `http://127.0.0.1:5174`. It renders the real interface with simulated sign-in, coaching and in-memory saving. It does not connect to Google, OpenAI or the production database, and cannot access user accounts. Reload resets its sample data.

The sample preview has been checked at desktop and mobile viewport sizes: opening the assessment, sending an answer, correcting it, and viewing the rose-gold diamond and readable glass chat. These checks do not prove production authentication, real AI responses or production persistence. The normal deployment excludes the sample preview and retains Google authentication.

## Commercial validation

The original proposed offer is **₹999 for one month of Money Huddle check-ins**. Payment is a planned commercial test, not an implemented payment flow.

The pilot should establish whether Ratheesh can finish independently, complete a chosen action within seven days and pay to continue. These outcomes have not yet been established.

## Boundaries

Do not add bank connections, automatic account aggregation, document uploads, reminders, continuous listening, spoken AI responses, investment recommendations or autonomous decisions without approval.

The immediate priority is a reliable first-visitor production journey. Further product improvements are paused until approved.
