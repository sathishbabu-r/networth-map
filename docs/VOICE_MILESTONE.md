# Voice moved forward

The builder requested voice immediately after trying the typed flow, because typing creates too much effort. Push-to-talk now precedes snapshot, goals and actions; persistence stays last. First-session scope is unchanged.

The primary control starts browser speech recognition in English (India). A second tap stops it. Users review and edit the transcript before confirming the answer. Consent to browser speech processing is requested once per open session. Typing remains available.

No application audio storage or backend transcription was added. Browser speech service availability and provider retention vary and have not been verified for production use. The UI discloses this before recording; do not promise private or local-only audio processing.

Browser checks in Edge: disclosure blocks recording until acknowledged, start disables navigation while capturing, stop restores editing and navigation, first-question Back remains disabled, and an empty recording reports no words captured. A typed answer still advances after stopping. No human speech transcription accuracy has been verified. Production build passes.

This is a voice-input prototype with fixed questions, not a complete conversational AI coach. Proposed structured entries and snapshot confirmation belong to the next milestone.
