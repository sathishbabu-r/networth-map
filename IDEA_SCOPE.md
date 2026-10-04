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

## The one goal they hire it for — money

> **“Help me get clear about my finances and take a useful step towards a goal that matters to me.”**

## Delta 4 — the steps today → the steps with my product

### Today

Collect statements → ask the accountant → enter figures in a spreadsheet → work out priorities → decide what to do → remember to follow up.

### With My Money Huddle

Answer a question by speaking or typing → confirm the starting snapshot → see a simple formula-based insight where the data supports one → choose one goal → commit to one action.

My existing MAP takes about 30 minutes to complete.

The first-session target here is narrower:

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

> **“I have things I need to sort out financially, but I keep putting them off.”**

It could be an outstanding payment, an upcoming expense, a loan commitment or a goal they have not acted on.

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
