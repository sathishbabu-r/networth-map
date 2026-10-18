# Networth MAP / Money Huddle

Authoritative product strategy · 10 October 2026. [DESIGN.md](DESIGN.md) describes the experience; [TECH.md](TECH.md) describes implementation and proof. Older specifications and reports are dated references, not competing current instructions. [Documentation review](docs/DOCUMENTATION_REVIEW.md) records conflicts and remaining gaps.

## Vision and problem

Help people understand their money, connect it to the life they want, choose a useful next step and learn from what actually happens.

The starting problem is fragmented financial understanding: business and personal figures are mixed, accessible cash is confused with wealth, goals remain vague, and a conversation about money rarely connects to recorded follow-through. The product aims to reduce the effort of organising these facts and deliberating about a pressing decision.

**Blueprint → Vision → MAP → Money Huddle → Action → Reported outcome → Learning.** Networth MAP provides the financial picture. Money Huddle is the single coaching conversation. Financial Review organises supported evidence; it does not choose or execute a financial decision.

## Users and positioning

Initial focus: Indian business owners and founders who need personal financial clarity, particularly when a near-term obligation exposes a cash gap. The implemented assessment also supports professionals and salaried people. These options are not proof of demand in four market segments.

The recorded initial example is a business owner facing school fees and considering help from a friend. It is a discovery context, not evidence that the app solved that person's problem. The builder's recorded CA and finance experience and professional networks support recruitment; they do not establish market size or product effectiveness.

Positioning hypothesis: an understandable financial picture connected to voluntary decisions and accountability, using figures the user supplies. The comparison set includes spreadsheets, trusted advisers, INDmoney and Fold; current competitor capabilities and comparative superiority have not been verified.

## Value proposition and current scope

- Organise personal income, assets, liabilities, spending, investing and aspirations through the existing twelve-step journey.
- See supported calculations with missing information and estimates kept distinct from zero.
- Request a focused or full Financial Review and explore supported findings in one Money Huddle conversation.
- Choose a goal and action, confirm consequential proposed updates, record execution and actual financial results, and return to a private journal.
- Resume saved account context; export or delete saved product records.

These capabilities exist in code. Their reliability and evidence limits are documented in TECH.md. A live page and passing tests do not establish useful AI synthesis or successful customer outcomes.

## Boundaries

Users supply information and remain responsible for choosing actions. The app does not connect banks, verify balances against statements, move money, trade, prescribe regulated products, automatically infer financial benefit from completion, or silently update balances from outcomes. No payment/subscription flow, adviser marketplace, automatic reminders, continuous voice conversation or spoken AI replies is implemented.

Existing consultation/contact links and optional consented email capture are part of the result screen. They are not an integrated adviser-booking or financial-data-sharing service. Product processing and retention limits belong in TECH.md; privacy copy must not promise unverified provider retention.

Planned improvements include more consistent uncertainty controls, validated scenarios, stronger qualitative verification and better evidence for recurring coaching. Bank aggregation, autonomous transactions and additional regulated specialist agents are outside the current sprint scope.

## Success and commercial hypotheses

No real-user completion rate, outcome lift, retention, conversion, willingness to pay, latency benchmark or advantage over a strong single model has been established. The landing page's twenty-minute assessment and the proposed fifteen-minute Huddle are targets, not measured durations.

| Question | Proposed validation |
|---|---|
| Does the picture help? | Of ten non-finance participants, aim for eight to understand their financial story and eight to report a new useful observation. Record their own explanations. |
| Does it lead to voluntary action? | Aim for five of ten to choose a seven-day commitment and five to report progress; distinguish execution, reported money and changed balances. |
| Does the urgent use case work? | Observe the initial school-fees scenario independently: time to clarity, credible funding choice, actual follow-through and repayment risk. |
| Will people pay? | Test genuine willingness with at least three of ten; founding-member price hypothesis ₹499/month. No checkout or payment results exist. |
| Is the AI approach worth its complexity? | Compare identical synthetic facts against a configured strong single model using real outputs and blind independent ratings. No winner is established. |

Recruitment targets are thirty prospects, ten interviews and five pilots, not achieved counts. The earlier ₹999 price is historical and superseded by the ₹499 hypothesis; annual pricing remains untested. Costs, acceptable review latency and sustainable subscription margins require measurement. Fix financial integrity and core-flow defects before using pilot outcomes to judge value.

## Evidence and document ownership

Use code to establish behaviour, tests to establish their tested boundaries, and dated reports to establish what was observed on a particular release. Historical reports must retain failures and limits. Current fixes do not retrospectively change their findings. Product changes belong here; screen behaviour belongs in DESIGN.md; architecture, correctness rules, privacy, checks and deployment belong in TECH.md.
