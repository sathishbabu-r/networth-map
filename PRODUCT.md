# PRODUCT · My Money Huddle

> **Interaction update — 3 October 2026:** The builder chose automatic memory between visits. Financial answers, the chosen goal, dated action and reported outcomes are saved without confirmation cards. Users correct remembered information through conversation. This replaces the confirmation-card requirement described below. Privacy disclosure, processing consent, export/deletion, authentication and formula-based calculations remain in place. The application still does not retain full chat history or raw audio.

## 1. THE JOB

**My Money Huddle is a conversational AI financial clarity and accountability agent for business owners.**

It helps a user talk through a financial issue and move from:

> **“I have something financially important I keep putting off.”**

to:

> **“I understand my situation, I know what I want to achieve, and I know what I will do next.”**

The first Huddle should take **15 minutes or less**.

The target outcome is:

**Confirmed Snapshot → One Goal → One Dated Action**

---

## 2. THE USER

The first pilot user is **Ratheesh**, a business owner with income, assets, loans, expenses and family commitments spread across different places.

He may not have all his numbers ready.

The agent accepts:

- exact figures,
- estimates,
- ranges,
- incomplete information, and
- “I don't know.”

The agent should create value without forcing Ratheesh to complete his entire Networth MAP first.

He should be able to complete the first Huddle independently.

---

## 3. THE CONVERSATIONAL AGENT

My Money Huddle should feel like talking to a trusted financial thinking partner — **not completing a questionnaire**.

The user interacts through:

**🎙 Speak** or **⌨ Type**

Both are simply different ways of participating in the same conversation.

The agent begins:

> **Money Huddle:**  
> What's the one financial issue on your mind right now?

Ratheesh:

> Cash is tight because customers haven't paid me.

The agent does not follow a fixed questionnaire.

It uses the current conversation and previously confirmed context to decide the **next most useful question**.

> **Money Huddle:**  
> Understood. Roughly how much is currently outstanding from customers?

Ratheesh:

> Around eight lakh.

The agent extracts:

> **Customer receivables: ₹8,00,000 · Estimate**

The user confirms or corrects important financial information before it becomes part of the saved snapshot.

The agent continues:

> **Money Huddle:**  
> And roughly how much of that ₹8 lakh is already overdue?

Ratheesh:

> About five lakh.

The conversation continues naturally.

The agent asks **only enough questions to understand the current issue and help the user reach a useful next action**.

It should not attempt to collect every possible financial detail.

---

## 4. HOW THE AGENT THINKS

The agent follows a simple internal loop:

**LISTEN → UNDERSTAND → CLARIFY → CONFIRM → CALCULATE → COACH → COMMIT**

### LISTEN

Understand what the user is trying to solve.

Do not immediately start collecting financial data.

First understand **why the user started the Huddle**.

### UNDERSTAND

Extract relevant financial facts from the conversation.

Distinguish between:

- confirmed figures,
- estimates,
- ranges,
- unknown information, and
- statements that require clarification.

### CLARIFY

Ask the **next most useful question** when important information is missing or ambiguous.

The agent should avoid unnecessary questions.

The objective is not to complete a financial questionnaire.

The objective is to understand **enough to help the user move forward**.

### CONFIRM

Important financial information is confirmed before becoming part of the saved financial snapshot.

For example:

> **I understood:**  
> Customer receivables: ₹8,00,000  
> Estimate

**[✓ Confirm] [Edit]**

Confirmed context can then be remembered for future Huddles.

### CALCULATE

Use defined formulas to calculate relevant facts from confirmed information.

Example:

₹5 lakh overdue ÷ ₹8 lakh receivables = **62.5% overdue**

Calculations should be reproducible and explainable.

### COACH

Help the user think through:

- what matters,
- what outcome they want,
- what options they have, and
- what they are realistically willing to do.

The agent can ask:

> “What outcome would make the biggest difference right now?”

or:

> “What could you realistically do about this this week?”

or:

> “What is stopping you from doing that today?”

The agent helps the user **think and choose**.

It does not make the decision for them.

### COMMIT

Turn the user's chosen action into something specific and dated.

For example:

> **Action:** Call the five customers with the largest overdue balances  
> **Due:** Friday

The user confirms the commitment.

---

## 5. FINANCIAL INTELLIGENCE

The product separates:

**Confirmed Facts → Calculations → Insights → User Decisions → Actions → Outcomes**

For v1, financial insights must be **deterministic**.

### Allowed

> “₹5 lakh of your ₹8 lakh receivables are overdue — 62.5%.”

> “Your ₹80,000 monthly EMI represents 40% of your ₹2 lakh monthly income.”

> “You have ₹5 lakh available against ₹7 lakh of payments due this month — a ₹2 lakh gap.”

These observations come directly from confirmed numbers and defined formulas.

### Not allowed in v1

> “Your debt is too high.”

> “You should repay this loan immediately.”

> “This investment is a bad decision.”

> “You should sell this asset.”

> “You can afford this purchase.”

These require financial judgement.

### V1 rule

> **If a conclusion can be calculated from confirmed data using a defined formula, the agent can show it. If it requires financial judgement, it waits.**

The conversational AI handles the dialogue.

Defined financial logic handles the calculations.

The product should make it possible to understand **how a number was calculated**.

---

## 6. THE HUDDLE LOOP

A successful Money Huddle should naturally move through:

### OPEN

> **“What's on your mind financially?”**

↓

### EXPLORE

Understand the issue through conversation.

↓

### CLARIFY

Ask only the questions needed to understand the issue.

↓

### CONFIRM

Build a small, relevant and confirmed financial snapshot.

↓

### INSIGHT

Surface one useful formula-based observation when supported by confirmed data.

↓

### GOAL

Ask:

> **“What would you like to achieve?”**

The user chooses the goal.

↓

### OPTIONS

The agent may help the user think through possible actions.

The user remains the decision-maker.

↓

### ACTION

Ask:

> **“What's one thing you are willing to do this week?”**

↓

### COMMIT

Specify:

**What + By When**

↓

### CLOSE

Show the Huddle summary:

**Snapshot → Insight → Goal → Action**

For example:

### YOUR MONEY HUDDLE

**SNAPSHOT**  
₹8 lakh customer receivables  
₹5 lakh overdue

**INSIGHT**  
62.5% of customer receivables are overdue.

**GOAL**  
Collect ₹3 lakh this month.

**THIS WEEK**  
Call the five customers with the largest overdue balances by Friday.

Then offer:

> **Continue with My Money Huddle**  
> ₹999 for one month of Money Huddle check-ins.

**[Continue for ₹999]**

Payment happens inside the product.

---

## 7. RETURN HUDDLE & V1 BOUNDARY

When the user returns, My Money Huddle remembers **confirmed context and commitments**.

It should not restart onboarding or ask the user to repeat information already confirmed.

Instead:

> **Money Huddle:**  
> Last time you wanted to collect ₹3 lakh and committed to calling your five largest overdue customers by Friday. What happened?

The user can **speak or type**.

Ratheesh:

> I called all five. Three paid. I collected two lakh.

The agent proposes:

> **Action:** Call five overdue customers  
> **Status:** Completed
>
> **Outcome:** Three customers paid  
> **Amount collected:** ₹2,00,000

The user confirms or corrects the information.

The product distinguishes:

**ACTION → OUTCOME → FINANCIAL IMPACT**

These are not the same thing.

For example:

**Action:** Called five customers.

**Outcome:** Three customers paid.

**Financial impact:** ₹2,00,000 collected.

Completing an action is not automatically counted as financial improvement.

---

# V1 INCLUDES

- Conversational AI agent
- Chat
- Push-to-talk
- Context-aware follow-up questions
- Speech-to-text
- Structured financial data extraction
- Estimates and unknown values
- Confirm/edit before important information is saved
- Saved confirmed context
- Formula-based financial calculations
- One useful deterministic insight where supported
- One chosen goal
- One dated action
- Return Huddle
- Remembered commitments
- Action vs outcome tracking
- Financial impact recording
- ₹999 in-app payment

---

# V1 EXCLUDES

- Full Networth MAP
- Bank connections
- Automatic account aggregation
- Document uploads
- Portfolio recommendations
- Investment recommendations
- AI financial judgement
- Autonomous financial decisions
- Continuous listening
- Spoken AI responses
- Multiple simultaneous goals
- Complex dashboards
- Automated reminders
- Automated outcome verification
- Weekly/monthly/quarterly reports
- Comprehensive financial planning

These wait until the core Huddle is validated.

---

# AGENT GUARDRAILS

The agent should:

- ask one useful question at a time,
- keep responses concise,
- use confirmed context instead of repeatedly asking for information,
- clearly identify estimates,
- acknowledge unknown information,
- show calculations transparently,
- ask for confirmation before important information is saved,
- help the user think rather than decide for them, and
- keep moving the conversation toward a useful outcome.

The agent should **not**:

- interrogate the user,
- complete the full Networth MAP unnecessarily,
- invent financial information,
- present assumptions as facts,
- overwhelm the user with analysis,
- make investment recommendations,
- make autonomous financial decisions, or
- continue asking questions once enough information exists to move toward a goal and action.

### Stopping rule

> **Once the agent has enough confirmed information to understand the issue and help the user choose a useful goal and action, it should stop gathering information and move the Huddle forward.**

---

# MILESTONES

## 1. FINISH

Ratheesh independently reaches:

**Confirmed Snapshot + One Goal + One Dated Action**

within:

**≤15 minutes**

I do not guide him or touch the keyboard.

---

## 2. ACT

Ratheesh completes his chosen action within:

**7 days**

If he does not complete it, understand why before building reminders or additional accountability features.

---

## 3. PAY

At the end of the first Huddle, Ratheesh is offered:

> **₹999 for one month of Money Huddle check-ins.**

Payment happens **inside the product**.

Actual payment is the strongest early commercial validation signal.

---

# V1 SUCCESS

The product experience is:

> **CONVERSE → UNDERSTAND → CLARIFY → CONFIRM → CHOOSE → COMMIT → RETURN → MEASURE**

The validation loop is:

> **FINISH → ACT → PAY**

The sprint does not need to prove the entire Networth Coach vision.

It needs to prove that a business owner will:

1. have a useful financial conversation with the agent,
2. reach a meaningful action within 15 minutes,
3. follow through on that action, and
4. pay to continue using the product.

If those signals appear, **My Money Huddle earns the right to become a larger financial intelligence and accountability platform.**
