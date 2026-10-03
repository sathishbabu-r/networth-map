## IDEA LOCK · Build Sprint

**The idea, in one line:**  
My Money Huddle helps a business owner talk through their finances and leave a 15-minute session with one goal they have chosen and at least one practical starting action, with room to choose more.

**Why me:**  
I am a Chartered Accountant with over 20 years of experience in finance, internal controls, governance and digital transformation.

I have built Networth MAP and prepared MAPs by hand. My method is **Blueprint → Vision → MAP**: understand where you stand, where you want to go and what steps to take.

I understand the financial questions to ask. Now I want to make answering them and following through easier. My professional, business and Rotary networks give me access to early users.

For this sprint, I will bring my method and questions but build the product fresh.

## GOAL

**The one goal they hire it for — money:**  
“Help me get clear about my finances and take a useful step towards a goal that matters to me.”

**Delta 4 — the steps today → the steps with my product:**  
Today: collect statements → ask the accountant → enter figures in a spreadsheet → work out priorities → decide what to do → remember to follow up.

With My Money Huddle: answer a question by speaking or typing → confirm the starting snapshot → choose one goal → choose practical actions and a starting priority.

My existing MAP takes about 30 minutes to complete. The first-session target here is narrower: **one chosen goal and at least one practical starting action within 15 minutes**. A fuller MAP can develop over time. A fourfold improvement is still a hypothesis to measure.

**The sin it rides:**  
Sloth. People postpone organising their finances because gathering information and maintaining a spreadsheet feels like work. I want to make starting easier.

## USER

**The initial user:**  
A business owner with income, assets, loans and family commitments spread across different places, who wants clarity and help following through.

**The trigger:**  
“I have things I need to sort out financially, but I keep putting them off.”

It could be an outstanding payment, an upcoming expense, a loan commitment or a goal they have not acted on.

**Today’s path, step by step:**

1. Check bank balances and investment accounts.
2. Ask the accountant for missing figures.
3. Collect statements and estimate values.
4. Discuss with a spouse, CA, adviser or friend.
5. Decide on an action—or postpone it.
6. Lose track of the follow-up and revisit it later.

**Who they trust on this decision:**  
Their CA, financial adviser, spouse and experienced business peers.

The product must earn trust through understandable calculations, visible assumptions and control over what gets saved.

**One named pilot user:**  
**Ratheesh.** I will ask him to complete the first session independently while I observe.

**Would they pay?**  
Nobody has paid me for a MAP yet.

I will test a **₹999 follow-up review**, personally delivered while the ongoing coach is being validated. I will explain what it includes and make the offer at the end of the first session.

Payment is the strongest signal. Booking the next session without prompting is useful evidence of interest, but it is not the same as paying.

## PRODUCT

**Onboarding — how a first-time user feels the value fastest:**  
Start with:

**“What is the one financial issue on your mind right now?”**

Ask one question at a time. The user can tap the microphone to answer or type if they prefer.

- **Blueprint:** Understand their income, expenses and full net worth picture: cash, investments, property, business ownership, other assets and all debts.
- **Vision:** Help them choose one goal.
- **MAP:** Help them choose at least one practical starting action with a date. Allow additional actions when they have the time and willingness; one action is a starting point, not a cap.

Users choose **personal finances, business finances or both**. If they choose both, the snapshot shows them together while labelling each item and keeping personal and business totals separate. Business ownership and the underlying business assets must not be counted twice. Estimates and unknown values remain visible.

Estimates and “I don’t know” are accepted. The coach collects enough information for a useful starting picture without pretending it is complete.

Before saving, the user reviews and confirms what the app understood.

**The voice experience in v1:**  
I want to test whether speaking reduces the effort of getting started.

The first version uses **push-to-talk**:

1. The question appears on screen.
2. The user taps the microphone and speaks.
3. The app shows the transcript and proposed entry.
4. The user confirms or corrects it.

For example:

> “My income is around two lakh a month, but it varies.”

The app proposes:

> Monthly income: ₹2,00,000 · Estimate · Variable

Typing remains available. Continuous listening and spoken AI replies come later.

**The core loop — my user stories:**

- As a business owner, I want to speak about my finances without filling in a long spreadsheet.
- I want to see what the coach understood and correct it before saving.
- I want missing information and estimates to remain visible.
- I want to choose one goal and leave with a specific action and date.
- I want one action to be a starting point, with freedom to choose more dated actions when I have time and willingness.
- When I return, I want to record what happened without repeating my story.
- I want to distinguish completing an action from actually improving my finances.

**Coming back — the longer-term vision:**  
I want people to say, **“Let me do a quick money huddle.”**

They might plan their next steps in the morning, return after completing an action or think through a question when they have a few minutes.

The coach remembers confirmed context, follows up on commitments and helps them work through obstacles. Encourage at least one useful action each day, with more when the user has time and willingness. Users may choose three to five actions or another realistic number; there is no compulsory quota or fixed cap. Help them choose a starting priority and scale an action down when needed. Useful actions include learning, gathering information and reviewing a decision—not only transactions. Daily encouragement is supportive, without shame or claims of guaranteed wealth growth.

The purpose is **daily imperfect progress**, not a compulsory number of visits or tasks.

**Making progress visible:**  
The dashboard connects actions to confirmed outcomes.

It distinguishes additional income, expense reductions, debt repayments, savings allocations and collections of money already owed.

If someone reduces an expense by ₹2,000 and transfers that same ₹2,000 into savings, the financial benefit is ₹2,000—not ₹4,000.

Expected benefits remain separate from realised results. Weekly, monthly, quarterly and annual views belong to the later product.

**The AI-first part:**  
AI asks relevant follow-up questions, organises answers, identifies gaps and helps turn an intention into a practical action.

It supports reflection and accountability. It does not make financial decisions for the user or prescribe the same actions to everyone.

Financial calculations use defined formulas. Important updates require confirmation.

The coach follows [evidence rules](docs/COACH_EVIDENCE_RULES.md) before answering or changing the MAP. V1 labels unknowns, estimates, user-confirmed information and calculated results. Confirmation does not remove uncertainty from an estimate. Important dashboard figures expose their source, relevant date/period, formula and missing assumptions. At the final saving milestone, confirmed changes preserve previous values and a minimal change history so mistakes can be corrected. Document uploads and recurring action/outcome tracking remain later work.

The product and coach framework is documented in [docs/COACH_FRAMEWORK.md](docs/COACH_FRAMEWORK.md), with fictional behaviour checks in [docs/COACH_EXAMPLES.md](docs/COACH_EXAMPLES.md). The research library informs relevant coaching rather than adding every expert's system to the first session. The [research audit](docs/RESEARCH_AUDIT.md) records narrowly supported claims and withheld principles; earlier summaries and new claims are not automatically approved as factual grounding. Source checks and honest uncertainty must be carried into the working coach.

**Privacy:**  
This sprint will use Convex for saved information and cloud providers for AI and speech processing.

Before recording or chatting, users will be told what is processed and saved. Confirmation before saving to the MAP does not mean the conversation has not already been processed by a provider.

The product will include:

- No bank connections.
- Confirmation before saving MAP updates.
- Authenticated access to saved profiles.
- Export and deletion controls.
- Clear processing and retention disclosures.

My proposed default is not to retain raw audio or full transcripts in the application. Provider retention must be checked before making promises.

**What I will build in this sprint:**  
A fresh product in `~/build-sprint-app`, using the required Convex stack and submitted at a `.convex.site` address.

The scope is:

**One question at a time → spoken or typed answers → confirmed snapshot → one chosen goal → practical dated actions, with at least one starting action.**

The closing dashboard shows those results together.

Push-to-talk is my proposed change to Shaktimaan’s typing-only recommendation. I will keep the rest of the scope unchanged and confirm that this addition fits the sprint.

### v1 milestones — simplest first

Each milestone has a quick check that can be completed in about ten seconds once its screen is ready.

1. **Typed answers, one question at a time.** Start with “What is the one financial issue on your mind right now?” Accept estimates and “I don’t know.”
   - **Quick check:** Type an answer and see the next relevant question.
2. **Review and confirm the starting snapshot.** Let users choose personal finances, business finances or both. Cover income, expenses, cash, investments, property, business ownership, other assets and all debts. Label each item, keep personal and business totals separate, and prevent double counting business ownership and underlying business assets. Show estimates and missing information and allow corrections before confirmation.
   - **Quick check:** Correct one figure, confirm, and see the corrected snapshot.
3. **Choose one goal.** Help the user name a goal and explicitly choose it.
   - **Quick check:** Choose a goal and see it alongside the snapshot.
4. **Choose practical actions and a starting priority.** Capture at least one practical action and its date, allow additional actions, and let the user choose which to start with. The closing screen shows the confirmed snapshot, goal and chosen actions together.
   - **Quick check:** Confirm two dated actions and see both, with one marked as the starting priority.
5. **Add push-to-talk voice.** Explain processing before recording. Show the transcript and proposed entry for correction or confirmation; typing stays available.
   - **Quick check:** Speak a short answer and confirm or correct what appears.
6. **Keep confirmed data after closing the app.** Add authenticated access and save confirmed results in Convex, with clear saving information and export and deletion controls.
   - **Quick check:** Close and reopen the app and see the same snapshot, goal and chosen actions.

These milestones cover only the first session. Flexible action selection belongs in v1; daily encouragement and follow-through belong to the later coach. No daily check-ins, reminders, reports or bank connections are included.

Daily coaching, automated reminders, document organisation and longer-term reports wait until the first session proves useful.

## MARKET

**Tailwinds:**  
The opportunity I want to test is whether speaking makes financial organisation easier and whether accountability helps people follow through.

Funding trends and Google Trends evidence still need verification.

**Competitors — and flows to learn from:**  
My initial comparison set is INDmoney, Fold, spreadsheets and working with a trusted adviser.

I will review their onboarding, financial summaries and return experiences. Screenshots and specific observations will follow that review.

My proposed difference is the connection between **understanding your position, choosing an action and recording its actual result**.

**Size and fit:**  
I will identify **30 prospects**, interview **10** and start with **five pilot users**, beginning with Ratheesh.

These are recruitment targets. I have not established market size or willingness to pay.

## VALIDATION

**Before building the ongoing paid coach, I want three signals:**

1. **Ratheesh finishes independently.**  
   Within 15 minutes, he confirms the starting snapshot, chooses one goal and at least one dated starting action, and can choose more if useful. I do not guide him or touch the keyboard.

2. **He completes the action within seven days.**  
   I check once by hand on day seven. If he does not complete it, I understand why before building reminders.

3. **He pays to continue.**  
   I offer the clearly defined ₹999 follow-up review at the end of the first session. An independently booked next session is a weaker signal.

**Sprint thesis:**  
My Money Huddle should make it easier to start looking after your finances and take one useful step.

The first proof is a completed session. The next is a completed action. Payment will tell me whether the support is valuable enough to build further.
