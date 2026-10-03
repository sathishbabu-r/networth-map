# Conversational coach trial

The builder approved replacing the fixed questionnaire with a real coach that reflects the concern and asks one relevant next question. Voice input remains available, with editable words before sending.

Implemented: a temporary conversation in the tab, a Convex action using the Agent component with message saving disabled and no persistent thread, Blueprint → Vision → MAP coaching instructions, and keyword selection of up to four relevant narrow supported claims from the 75-entry source register. This simple source selection is not comprehensive semantic retrieval or proof of model compliance.

Type checking, production build and Convex development deployment succeed. Real model access is blocked: the development team's Convex AI Gateway reports that the team must upgrade to a paid plan. No successful generated response or coaching behaviour has been verified. The opening question is static and must not be mistaken for a generated response.

The UI preserves entered answers when a request fails. No hosting deployment was performed. Saved snapshots, goal/action confirmation, authentication and persistence remain pending.

Next: the builder chooses how to enable AI access, then run the fictional examples in COACH_EXAMPLES.md against actual replies before declaring this coach usable.
