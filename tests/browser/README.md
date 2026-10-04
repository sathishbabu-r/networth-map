# Local sample-data preview

Run `npm run test:browser` and open http://127.0.0.1:5174.

This renders the real App, assessment and chat with local sample services. It begins signed in to a simulated account. It does not contact Google, OpenAI or Convex, use keys, read user accounts or save production data. Reload resets its in-memory data. Voice and real provider connections are not tested here.

For the chat saving/correction fixture, send `My annual gross personal income is 2400000`, then `Correction: my annual gross personal income is 2600000`. Verify that the MAP changes, the composer clears and no Confirm, insight or first-message popup appears.

The separate Vite configuration binds to this computer only and refuses build commands. Normal `npm run build` and `npm run deploy` continue to use the production app and real authentication. This preview proves interface flows, not production authentication or database integration.
