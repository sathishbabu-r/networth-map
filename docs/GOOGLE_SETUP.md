# Connect Google and speech

The app is already wired for Google through Convex Auth. External account credentials are still needed. Keep secrets in Convex, not in chat or a committed file.

## Development Google connection

Create/select a project in Google Auth Platform, configure My Money Huddle's consent screen and add the pilot's Google account as a test user if the app is in testing. Create a Web application client.

- Authorized JavaScript origin: `http://127.0.0.1:5173`
- Authorized redirect URI: `https://dusty-zebra-15.convex.site/api/auth/callback/google`

In the **development** Convex deployment's Settings → Environment Variables, save the Google client ID as `AUTH_GOOGLE_ID` and client secret as `AUTH_GOOGLE_SECRET`. Signing keys and `SITE_URL=http://127.0.0.1:5173` are already configured.

Official instructions: [Convex Auth Google setup](https://labs.convex.dev/auth/config/oauth/google).

## OpenAI connection

Create/use a server API key with access to the speech and coach models, and save it as `OPENAI_API_KEY` in the same Convex deployment. The key stays on the backend. The app uses `whisper-1` for transcription and `gpt-4o-mini` for the coach fallback when Convex AI Gateway is unavailable. Account access and billing must be working; merely having a key is not proof the requests will succeed.

[OpenAI file transcription documentation](https://developers.openai.com/api/docs/guides/speech-to-text).

## Production

Development secrets do not automatically become production secrets. Before the final release, configure Google, OpenAI, signing keys, and `SITE_URL` in the production deployment. Add the production `.convex.site/api/auth/callback/google` redirect URI to the Google client. Use the actual production address; do not reuse the development address by assumption.

Deployment uses `npm run deploy`, which builds and hosts the app with the Convex static-hosting component. Test the returned live address after deploying.
