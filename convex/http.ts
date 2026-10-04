import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";
import { auth } from "./auth";
import { httpAction, type ActionCtx } from "./_generated/server";
import { firstPartyGoogleCookies } from "../shared/auth-cookies.mjs";
const http = httpRouter();
auth.addHttpRoutes(http);
const googleSignIn = http.lookup("/api/auth/signin/google", "GET")![0];
// Convex's registered action exposes its original handler at runtime.
const googleSignInHandler = (googleSignIn as unknown as {
  _handler: (ctx: ActionCtx, request: Request) => Promise<Response>;
})._handler;
http.route({
  path: "/api/auth/signin/google",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const response = await googleSignInHandler(ctx, request);
    return firstPartyGoogleCookies(response, process.env.SITE_URL, process.env.CONVEX_SITE_URL);
  }),
});
registerStaticRoutes(http, components.staticHosting);
export default http;
