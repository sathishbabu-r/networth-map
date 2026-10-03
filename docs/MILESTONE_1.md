# Milestone 1: typed answers

Run `npm run dev` and open the printed local address. `npm run build` creates the production files. No hosting deployment has been added or run.

The app asks ten Blueprint questions, one at a time. Answers are plain text in memory, including estimates and unknowns. Back restores earlier answers for editing. Empty answers show a recovery message. The ending screen clearly states that nothing was saved.

Verified in Edge: empty-answer validation, finance selection, a variable income estimate, Back restoring the estimate, unknown answers through the remaining questions, and the ending screen. The production build passed. Desktop appearance inspected. Mobile layout is implemented but has not been checked in a mobile browser.

This is a fixed question flow, not an AI coach. Snapshot confirmation, calculations, goals, actions, speech, authentication and saving remain later milestones. Research sources and the Blueprint → Vision → MAP method remain in COACH_FRAMEWORK.md, RESEARCH_AUDIT.md and RESEARCH_SOURCES.json; retrieval from that library is not implemented.

The previous Networth MAP is background experience, not the implementation being extended. Its three-priority cap and thirty-day device retention are not requirements for this app. The agreed direction permits additional actions without a fixed cap; daily encouragement belongs to the later coach.
