# Built-in recorded speech-to-text

Voice now uses microphone recording and OpenAI Whisper through a Convex action, replacing browser-managed speech recognition. Tap to record, tap to stop, review and edit the transcript, then explicitly send it to the coach. Recording is limited to one minute and 750 KB. Browser formats are selected from WebM, MP4 and Ogg.

The server reads OPENAI_API_KEY from Convex environment variables. Never put it in VITE variables, source code, or chat. Configure it in the development deployment's Settings → Environment Variables before live transcription tests. OpenAI API billing is separate from Convex billing.

Recordings are never written to Convex storage or tables by this feature. Failed recordings remain in browser memory for retry or discard. Audio is processed by Convex and OpenAI; provider retention has not been verified, and the UI makes no local-only processing promise. Generated text is editable and is not automatically sent to the coach.

Verification: three unit checks with simulated recorder and transcription service pass: missing key avoids microphone capture, successful text preserves prior input and releases the microphone, and retry retains failed audio without overwriting typed input. Backend type checking, production build and development backend push pass. Browser checked the disclosure and missing-key state. Live audio recognition cannot be verified until an OpenAI key is configured.

Authentication, abuse controls and saved data remain pending. This development trial is not ready to publish for general users with a paid key attached.
