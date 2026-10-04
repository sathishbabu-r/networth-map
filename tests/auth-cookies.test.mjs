import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstPartyGoogleCookies } from '../shared/auth-cookies.mjs';
const production = 'https://lovely-lapwing-356.convex.site';
function response() {
 const headers = new Headers({Location:'https://accounts.google.com/example'});
 headers.append('Set-Cookie','__Host-googleOAuthpkce=test-proof; Path=/; Expires=Sun, 04 Oct 2026 04:00:00 GMT; HttpOnly; Secure; Partitioned; SameSite=None');
 headers.append('Set-Cookie','__Host-googleRedirectTo=test-destination; Max-Age=900; Path=/; HttpOnly; Secure; Partitioned; SameSite=None');
 return new Response(null,{status:302,headers});
}
test('first-party Google login keeps its proof and expiry in secure cookies available on return',()=>{
 const fixed=firstPartyGoogleCookies(response(),production,production);
 const cookies=fixed.headers.getSetCookie();
 assert.equal(cookies.length,2);
 assert.match(cookies[0],/^__Host-googleOAuthpkce=test-proof;/);
 assert.match(cookies[0],/Expires=Sun, 04 Oct 2026 04:00:00 GMT/);
 for(const cookie of cookies){assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.doesNotMatch(cookie,/Partitioned/);assert.doesNotMatch(cookie,/Domain=/);}
 assert.match(cookies[1],/Max-Age=900/);
 assert.equal(fixed.status,302);assert.equal(fixed.headers.get('Location'),'https://accounts.google.com/example');
});
test('development and separate frontend origins retain the existing cookie configuration',()=>{
 const original=response();
 assert.equal(firstPartyGoogleCookies(original,'http://127.0.0.1:5173',production),original);
 assert.equal(firstPartyGoogleCookies(original,'https://other.example',production),original);
});
