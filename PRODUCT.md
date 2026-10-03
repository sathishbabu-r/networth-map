# PRODUCT · My Money Huddle

## 1. THE JOB

**My Money Huddle is a conversational AI financial coaching agent for business owners.**

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

My Money Huddle should feel like talking to a financial coach — **not completing a questionnaire**.

The user interacts through:

**🎙 Speak** or **⌨ Type**

The same conversation supports both.

The agent begins:

> **Money Huddle:**  
> What's the one financial issue on your mind right now?

Ratheesh:

> Cash is tight because customers haven't paid me.

The agent does not follow a fixed questionnaire.

It uses the conversation and confirmed context to decide the **next most useful question**.

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

The agent should ask **only enough questions to understand the current issue and help the user reach a useful next action**.

It should not attempt to collect every possible financial detail.

---

## 4. HOW THE AGENT THINKS

The agent follows a simple internal loop:

**LISTEN → UNDERSTAND → CLARIFY → CONFIRM → CALCULATE → COACH → COMMIT**

### LISTEN

Understand what the user is trying to solve.

### UNDERSTAND

Extract relevant financial facts from the conversation.

### CLARIFY

Ask the next most useful question when important information is missing or ambiguous.

### CONFIRM

Important financial information is confirmed before becoming part of the saved financial snapshot.

### CALCULATE

Use defined formulas to calculate relevant facts from confirmed information.

Example:

₹5 lakh overdue ÷ ₹8 lakh receivables = **62.5% overdue**

### COACH

Help the user think through what they want to achieve and possible actions.

The agent can ask:

> “What outcome would make the biggest difference right now?”

or:

> “What could you realistically do about this this week?”

The agent helps the user think.

**It does not make the decision for them.**

### COMMIT

Turn the user's chosen action into something specific and dated.

> **Action:** Call five largest overdue customers  
> **Due:** Friday

The user confirms the commitment.

---

## 5. FINANCIAL INTELLIGENCE

The agent separates:

**Confirmed Facts → Calculations → Insights → User Decisions**

For v1, insights must be deterministic.

### Allowed

> “₹5 lakh of your ₹8 lakh receivables are overdue — 62.5%.”

> “Your ₹80,000 monthly EMI represents 40% of your ₹2 lakh monthly income.”

### Not allowed in v1

> “Your debt is too high.”

> “You should repay this loan immediately.”

> “This investment is a bad decision.”

### V1 rule

> **If a conclusion can be calculated from confirmed data using a defined formula, the agent can show it. If it requires financial judgement, it waits.**

The conversational AI handles the dialogue.

Defined financial logic handles the calculations.

---

## 6. THE HUDDLE LOOP

A successful conversation should naturally move through:

### OPEN

> “What's on your mind financially?”

↓

### EXPLORE

Understand the issue through conversation.

↓

### CONFIRM

Build a small, relevant financial snapshot.

↓

### INSIGHT

Surface one useful formula-based observation when supported by the data.

↓

### GOAL

> “What would you like to achieve?”

The user chooses the goal.

↓

### OPTIONS

The agent may help the user think through possible actions.

↓

### ACTION

> “What's one thing you are willing to do this week?”

↓

### COMMIT

Specify **what + by when**.

↓

### CLOSE

Show:

**Snapshot → Insight → Goal → Action**

Then offer:

> **Continue with My Money Huddle**  
> ₹999 for one month of Money Huddle check-ins.

Payment happens inside the product.

---

## 7. RETURN HUDDLE & V1 BOUNDARY

When the user returns, the agent remembers **confirmed context**.

It does not restart onboarding.

For example:

> **Money Huddle:**  
> Last time you wanted to collect ₹3 lakh and committed to calling your five largest overdue customers by Friday. What happened?

Ratheesh:

> I called all five. Three paid. I collected two lakh.

The agent proposes:

**Action:** Call five customers  
**Status:** Completed

**Outcome:** Three customers paid  
**Amount collected:** ₹2,00,000

The user confirms.

The product distinguishes:

**ACTION → OUTCOME → FINANCIAL IMPACT**

Completing an action is not automatically counted as financial improvement.

### V1 includes

- Conversational AI agent
- Chat
- Push-to-talk
- Context-aware follow-up questions
- Speech-to-text
- Structured financial data extraction
- Confirm/edit
- Saved confirmed context
- Formula-based calculations
- One chosen goal
- One dated action
- Return Huddle
- Action vs outcome tracking
- ₹999 in-app payment

### V1 excludes

- Full Networth MAP
- Bank connections
- Document uploads
- Investment recommendations
- AI financial judgement
- Continuous listening
- Spoken AI responses
- Autonomous financial decisions
- Multiple simultaneous goals
- Automated reminders
- Complex dashboards
- Automated outcome verification
- Long-term reporting

## MILESTONES

### FINISH
Ratheesh independently reaches:

**Confirmed Snapshot + Goal + Dated Action**

within **15 minutes**.

### ACT
He completes his chosen action within **7 days**.

### PAY
He pays:

**₹999 for one month of Money Huddle check-ins**

inside the product.

# V1 SUCCESS

> **CONVERSE → UNDERSTAND → CHOOSE → ACT → RETURN**

Commercial proof:

> **FINISH → ACT → PAY**
