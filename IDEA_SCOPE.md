# IDEA LOCK · Build Sprint

> **Approved expansion — 3 October 2026:** The integrated Networth MAP, conversational completion and daily progress scope is recorded in [MAP_HUDDLE_SCOPE.md](docs/MAP_HUDDLE_SCOPE.md). It replaces the earlier exclusions for the full MAP and daily check-ins.

## THE IDEA

**The idea, in one line:**  
My Money Huddle helps a business owner talk through their finances and leave a 15-minute session with one goal they have chosen and one action for this week.

## WHY ME

I am a Chartered Accountant with over 20 years of experience in finance, internal controls, governance and digital transformation.

I have built Networth MAP and prepared MAPs by hand. My method is:

**Blueprint → Vision → MAP**

- **Blueprint:** Understand where you stand.
- **Vision:** Understand where you want to go.
- **MAP:** Identify the steps to get there.

I understand the financial questions to ask. Now I want to make answering them and following through easier.

My professional, business and Rotary networks give me access to early users.

For this sprint, I will bring my method and questions but build the product fresh.

---

# GOAL

## The job they hire it for — money

> **“When my daughter's school fees are due and I need to arrange the money, I want to know what money I can actually access before the deadline and how I will cover any shortfall, so I can get the fees paid on time without creating another financial problem.”**

This job sentence passes all three checks: it makes sense without the product, names an observable moment, and contains exactly one “so I can” outcome in the user's words.

## How they feel now

Ratheesh feels restless because he is spending more than his income. The feeling lasts for a few days, then he gets on with his routine.

## How they want to feel

Relieved that they’ve arranged the money for their daughter’s school fees.

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

## Delta 4 — the steps today → the steps with my product

### Today

Collect statements → ask the accountant → enter figures in a spreadsheet → work out priorities → decide what to do → remember to follow up.

### Earlier general Huddle flow

The school-fees completion rules above replace this general flow’s goal-and-action endpoint for that use case.

Answer a question by speaking or typing → confirm the starting snapshot → see a simple formula-based insight where the data supports one → choose one goal → commit to one action.

My existing MAP takes about 30 minutes to complete.

The original general first-session target was:

**One confirmed starting snapshot + one chosen goal + one action within 15 minutes.**

A fuller MAP can develop over time.

A fourfold improvement is still a hypothesis to measure.

## The sin it rides

**Sloth.**

People postpone organising their finances because gathering information and maintaining a spreadsheet feels like work.

I want to make starting easier.

---

# USER

## The initial user

A business owner with income, assets, loans and family commitments spread across different places, who wants clarity and help following through.

## The trigger

Ratheesh's daughter’s school fees were due, and he needed to arrange the money.

The builder confirmed this was an actual experience: Ratheesh would call his friend to arrange money. Calling a friend is his current response to this situation.

He also puts off reviewing his finances amid his daily routines and has asked his family to review his spending and reduce expenses. The school-fees deadline is the concrete starting moment for this job.

## Today’s path, step by step

1. Check bank balances and investment accounts.
2. Ask the accountant for missing figures.
3. Collect statements and estimate values.
4. Discuss with a spouse, CA, adviser or friend.
5. Decide on an action — or postpone it.
6. Lose track of the follow-up and revisit it later.

## Who they trust on this decision

Their CA, financial adviser, spouse and experienced business peers.

The product must earn trust through:

- understandable calculations,
- visible assumptions,
- clear distinction between confirmed figures and estimates, and
- control over what gets saved.

## One named pilot user

**Ratheesh.**

I will ask him to complete the first session independently while I observe.

## Would they pay?

Nobody has paid for My Money Huddle yet.

I will test:

> **₹999 for one month of Money Huddle check-ins, paid in the app.**

The offer will be made at the end of the first session.

Payment is the strongest signal.

Booking another session or asking to continue without prompting is useful evidence of interest, but it is not the same as paying for the product.

---

# PRODUCT

## Product architecture

The longer-term product has two connected layers:

### Networth MAP — Financial Truth Layer

The Networth MAP progressively captures the user's confirmed financial position.

It answers:

> **“Where do I stand?”**

### My Money Huddle — Conversational Coaching Layer

My Money Huddle uses confirmed financial context to help the user understand what matters, choose a goal and decide what action to take.

It answers:

> **“What matters now, and what am I going to do about it?”**

The longer-term loop is:

**Networth MAP → Financial Intelligence → My Money Huddle → Action → Confirmed Outcome → Updated Networth MAP**

For this sprint, only the smallest useful part of this loop will be built.

---

# ONBOARDING

The first-time experience starts with:

> **“What is the one financial issue on your mind right now?”**

The coach asks **one question at a time**.

The user can tap the microphone to answer or type if they prefer.

### Blueprint

Understand enough relevant income, expenses, assets and liabilities to create a useful starting snapshot.

### Vision

Help the user choose **one goal**.

### MAP

Help the user identify **one practical action for this week**.

Estimates and **“I don't know”** are accepted.

The coach collects enough information for a useful starting picture without pretending that the picture is complete.

Before saving, the user reviews and confirms what the app understood.

---

# THE VOICE EXPERIENCE IN V1

I want to test whether speaking reduces the effort of getting started.

The first version uses **push-to-talk**:

1. The question appears on screen.
2. The user taps the microphone and speaks.
3. The app transcribes the response.
4. The app shows the transcript and proposed financial entry.
5. The user confirms or corrects it.

For example:

> “My income is around two lakh a month, but it varies.”

The app proposes:

> **Monthly income: ₹2,00,000 · Estimate · Variable**

Typing remains available.

Continuous listening and spoken AI replies come later.

---

# FINANCIAL INSIGHTS

The sprint keeps financial insights deliberately constrained.

## V1 rule

> **If an insight can be deterministically calculated from confirmed inputs, show it. If it requires AI judgement, it waits.**

For example:

**Monthly income:** ₹2,00,000  
**Monthly EMIs:** ₹80,000

The product can calculate:

> **“Your EMIs take 40% of what comes in each month.”**

It should not conclude:

> “Your debt is too high.”

Financial calculations use defined formulas.

AI may explain or organise confirmed information, but it should not silently invent calculations or make financial judgements in v1.

---

# THE CORE LOOP — USER STORIES

- As a business owner, I want to speak about my finances without filling in a long spreadsheet.
- I want to see what the coach understood and correct it before saving.
- I want missing information and estimates to remain visible.
- I want a simple calculated insight where my confirmed information supports one.
- I want to choose one goal and leave with a specific action and date.
- When I return, I want to record what happened without repeating my story.
- I want to distinguish completing an action from actually improving my finances.

---

# COMING BACK — THE LONGER-TERM VISION

I want people eventually to say:

> **“Let me do a quick Money Huddle.”**

They might plan their next steps, return after completing an action or think through a financial question when they have a few minutes.

The coach remembers confirmed context, follows up on commitments and helps them work through obstacles.

Users can discuss possible actions and choose what is realistic.

The purpose is:

> **Daily imperfect progress, not a compulsory number of visits or tasks.**

---

# MAKING PROGRESS VISIBLE

The dashboard connects actions to confirmed outcomes.

It distinguishes:

- additional income,
- expense reductions,
- debt repayments,
- savings allocations, and
- collections of money already owed.

It must avoid double counting.

If someone reduces an expense by ₹2,000 and transfers that same ₹2,000 into savings, the financial benefit is **₹2,000 — not ₹4,000**.

Similarly:

**Calling a customer about an outstanding payment = Action**

**Receiving ₹2,00,000 = Outcome**

Expected benefits remain separate from realised results.

Weekly, monthly, quarterly and annual views belong to the later product.

---

# THE AI-FIRST PART

AI:

- asks relevant follow-up questions,
- organises natural-language answers,
- identifies gaps,
- converts spoken answers into proposed structured financial information,
- helps users articulate their goal, and
- helps turn an intention into a practical action.

It supports reflection and accountability.

It does not make financial decisions for the user or prescribe the same actions to everyone.

The user chooses the goal.

The user chooses the action.

Financial calculations use defined formulas.

Important updates require confirmation.

---

# PRIVACY

This sprint will use Convex for saved information and cloud providers for AI and speech processing.

Before recording or chatting, users will be told what is processed and saved.

Confirmation before saving to the MAP does not mean the conversation has not already been processed by a provider.

The product will include:

- No bank connections.
- Confirmation before saving MAP updates.
- Authenticated access to saved profiles.
- Export and deletion controls.
- Clear processing and retention disclosures.

My proposed default is not to retain raw audio or full transcripts in the application.

Provider retention must be checked before making promises.

---

# WHAT I WILL BUILD IN THIS SPRINT

A fresh product in:

`~/build-sprint-app`

using the required Convex stack and submitted at a `.convex.site` address.

The scope is:

> **One question at a time → spoken or typed answers → confirmed snapshot → one formula-based insight where supported → one chosen goal → one action for this week.**

The closing dashboard shows those results together:

**SNAPSHOT → INSIGHT → GOAL → ACTION**

Push-to-talk is my proposed change to Shaktimaan's typing-only recommendation.

I will keep the rest of the scope unchanged and confirm that this addition fits the sprint.

The following wait until the first session proves useful:

- Full Networth MAP
- Bank integrations
- Continuous voice conversation
- Spoken AI responses
- AI-generated financial judgement
- Investment recommendations
- Daily coaching
- Automated reminders
- Document organisation
- Automated outcome verification
- Sophisticated dashboards
- Longer-term reports

---

# MARKET

## Tailwinds

The opportunity I want to test is whether:

1. speaking makes financial organisation easier, and
2. accountability helps people follow through.

Funding trends and Google Trends evidence still need verification.

## Competitors — and flows to learn from

My initial comparison set is:

- INDmoney
- Fold
- spreadsheets
- working with a trusted adviser

I will review their onboarding, financial summaries and return experiences.

Screenshots and specific observations will follow that review.

My proposed difference is the connection between:

> **Understanding your position → choosing an action → recording its actual result.**

## Size and fit

I will identify **30 prospects**, interview **10** and start with **five pilot users**, beginning with Ratheesh.

These are recruitment targets.

I have not established market size or willingness to pay.

---

# VALIDATION

Before building the ongoing paid coach, I want three signals.

## 1. Ratheesh finishes independently

Within **15 minutes**, he:

**confirms the starting snapshot → chooses a goal → commits to an action.**

I do not guide him or touch the keyboard.

## 2. He completes the action within seven days

I check once manually on Day 7.

If he does not complete it, I understand why before building reminders.

## 3. He pays to continue

At the end of the first session, I offer:

> **₹999 for one month of Money Huddle check-ins, paid in the app.**

An independently booked next session is a weaker signal.

**Payment is the strongest validation signal.**

---

# SPRINT THESIS

> **My Money Huddle should make it easier to start looking after your finances and take one useful step.**

The first proof is:

**Did they complete the session?**

The next is:

**Did they complete the action?**

The strongest early commercial signal is:

**Did they pay ₹999 to continue using the product?**

The sprint does not need to prove the entire Networth Coach vision.

It needs to prove:

> **FINISH → ACT → PAY**

If those signals appear, My Money Huddle earns the right to become bigger.
