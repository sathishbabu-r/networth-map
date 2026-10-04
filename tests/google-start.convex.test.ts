import { test, expect, vi, afterEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
const modules = import.meta.glob('../convex/**/*.{ts,js}');
afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals();});
test('production Google start sets first-party proof cookies while preserving the Google redirect', async () => {
 const site='https://lovely-lapwing-356.convex.site';
 vi.stubEnv('SITE_URL',site);vi.stubEnv('CONVEX_SITE_URL',site);
 vi.stubEnv('AUTH_GOOGLE_ID','test-client');vi.stubEnv('AUTH_GOOGLE_SECRET','test-secret');
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({issuer:'https://accounts.google.com',authorization_endpoint:'https://accounts.google.com/o/oauth2/v2/auth',token_endpoint:'https://oauth2.googleapis.com/token',jwks_uri:'https://www.googleapis.com/oauth2/v3/certs',code_challenge_methods_supported:['S256'],response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256']}),{headers:{'Content-Type':'application/json'}})));
 const t=convexTest(schema,modules);
 const start=await t.action(api.auth.signIn,{provider:'google',params:{redirectTo:site}});
 const redirect=new URL(start.redirect!);
 const response=await t.fetch(redirect.pathname+redirect.search);
 expect(response.status).toBe(302);
 const google=new URL(response.headers.get('Location')!);
 expect(google.origin).toBe('https://accounts.google.com');
 expect(google.searchParams.get('redirect_uri')).toBe(site+'/api/auth/callback/google');
 expect(google.searchParams.get('code_challenge')).toBeTruthy();
 const cookies=response.headers.getSetCookie();
 expect(cookies.some(cookie=>cookie.startsWith('__Host-googleOAuthpkce='))).toBe(true);
 for(const cookie of cookies){expect(cookie).toContain('HttpOnly');expect(cookie).toContain('Secure');expect(cookie).toContain('SameSite=Lax');expect(cookie).not.toContain('Partitioned');}
});
