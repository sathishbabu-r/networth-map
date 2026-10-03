# Evidence rules for My Money Huddle

Approved product requirements supplied by the builder. Documentation only; no working coach or storage behaviour has been tested.

The coach checks what it knows, what supports it and what is missing before answering or proposing a MAP update. Confidence follows evidence, not conversational fluency. Research ideas cannot supply missing personal financial facts.

## Information labels

| Evidence status | Meaning | Use |
| --- | --- | --- |
| Unknown | User has not supplied the information. | Ask when material; never assume zero. |
| Estimate | User gives an approximate figure. | Indicative results only, with the estimate visible. |
| User-confirmed | User reviewed and accepted the information. | Use as self-reported information, not independently verified truth. |
| Document-supported — later | A relevant document supports the entry. | Check ownership, date, amount, scope and relevance; a document need not be complete or current. |
| Calculated | Derived from other entries. | Show the formula, input references and inherited uncertainty. |

Confirmation and approximation must be recorded separately: an estimate can be user-confirmed while remaining an estimate. Calculation is a derivation label, not an upgrade in evidence quality. A calculated result can be estimated, incomplete or based on confirmed self-reported inputs. An unreviewed conversational statement is a proposed entry, not automatically user-confirmed.

V1 supports unknown, estimate, user-confirmed information and calculated results. No uploads or document checks in v1.

## Five checks before answering or proposing an update

1. **Relevance:** Is the information needed for this question available?
2. **Meaning:** Clarify monthly/annual, personal/business, gross/net and recurring/one-off where relevant. Include currency, ownership and valuation basis when necessary.
3. **Freshness:** Identify when the information was last confirmed and the date or period it describes. Ask again only if a change could materially affect the answer; confirmation today does not make an old valuation current.
4. **Consistency:** Check conflicts, duplicates, incompatible periods and confusing assets or transfers with income.
5. **Support:** Is the conclusion justified, or does it require a clarification or professional judgment?

Ask the single question that most affects the answer. Do not restart a long questionnaire or ask irrelevant questions just to fill fields. These checks are internal decision requirements; users receive the relevant basis or question, not a repetitive five-part checklist.

## Match the response to the evidence

| Situation | Required response |
| --- | --- |
| Enough relevant information | Answer and explain the basis. |
| Estimates are usable | Give an indicative result and state assumptions. |
| Material information is missing | Clarify before a conclusion; a labelled partial calculation may explain the gap but cannot imply affordability. |
| Information conflicts | Present the conflict and let the user resolve it. |
| Professional judgment is needed | Help prepare facts and questions for an adviser; do not invent a definitive conclusion. |

Example: “Based on the income and expenses you confirmed, the monthly difference is ₹25,000. This excludes the business payment because its amount is unconfirmed, so it is not a confirmed amount available to spend.”

Precision in arithmetic does not imply precision in inputs. Unknown is distinct from a confirmed zero. An incomplete net-worth result must be labelled incomplete.

## Completion and financial impact — later tracking

Check only the relevant missing details, one question per turn:

- What happened?
- What amount changed?
- Has it happened already or is it expected?
- What period does it relate to?
- Is the benefit already recorded elsewhere?

Example:

User: “I saved ₹2,000 today.”

Coach: “Was that an expense you reduced, money you transferred into savings, or something else?”

User: “I negotiated my monthly service bill from ₹5,000 to ₹3,000.”

Coach: “Has the lower bill taken effect, or does it start next month?”

If next month: propose negotiation completed, expected monthly reduction ₹2,000 and realised saving not yet confirmed. Confirm before saving. Do not record ₹24,000 as annual realised savings. Any annual projection must be separately labelled with its assumptions; no reporting feature is added to v1.

Collections require checking whether a receivable was already counted. Transfers to savings or investments are not two benefits. A bank call does not itself change a financial balance. The first-session coach must reason correctly about these statements, while recurring completion tracking remains later work.

## Confirmed writes and correction history

**Proposed update → user confirmation → save → recalculate → update dashboard.**

- Show the proposed old and new values, evidence labels, relevant dates and effect before confirmation.
- Ask whether a conflicting figure is an update over time or a correction to the previous entry.
- Tie confirmation to the exact proposal. If the proposal changes materially, obtain confirmation again.
- Preserve the previous value and a minimal change record: affected entry, old/new value and labels, applicable period, confirmation time and whether it was a correction or update.
- Keep the record with the confirmed data; do not require raw audio or full conversation retention. Export and deletion controls must include associated personal change history according to the disclosed policy.
- A statement alone does not overwrite an entry. Do not announce success until save succeeds.
- Recalculate from the saved confirmed version. If calculation fails, mark totals as pending; never present an old total as current. Retries must not create duplicate changes or benefits.
- A correction is another confirmed change, preserving the history. No full history dashboard is required in v1, but correction must be possible.

Minimal history belongs with the final v1 saving milestone. Earlier screens can show proposed corrections; persistence is still the last milestone.

## Visible evidence

Each important first-session dashboard figure must let the user inspect:

- Its source and evidence status, including any confirmed estimate.
- Confirmation date and the date or period the amount describes.
- Formula and inputs for calculations.
- Missing information, exclusions and assumptions.

Use descriptions such as “User-confirmed on 3 October; property value remains an estimate.” Do not invent a numerical confidence score. Confirmation is not independent verification. Source details remain available to the user rather than crowding every conversation turn.

## First-build acceptance checks

These are acceptance examples, not executed tests.

| User input | Required behaviour |
| --- | --- |
| “I earn two lakh.” | Clarify period and relevant income definition before confirmation or saving. Ask one question at a time. |
| “I don't know the loan balance.” | Preserve unknown; mark net worth incomplete. |
| “I collected ₹10,000 owed to me.” | Check the existing receivable; do not automatically record new income. |
| “I saved ₹2,000 and invested it.” | Clarify the event and avoid counting the same money twice. |
| New figure contradicts saved figure | Ask whether it is an update or correction; preserve the previous version. |
| “I called the bank.” | Offer to record completion if appropriate and confirmed; leave balances unchanged. No recurring tracking feature in v1. |
| User confirms an estimated property value | Keep both user confirmation and estimate status visible. |
| Save succeeds but recalculation fails | Show pending calculation, not a false current total. |

The research audit governs outside claims. This document governs personal evidence, calculations and changes. Both must be checked before a working coach is declared ready.
