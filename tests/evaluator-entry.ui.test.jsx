// @vitest-environment jsdom
// Interface tests only; real evaluator authentication is covered by evaluator.convex.test.ts.
import React from 'react';
import {test,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,waitFor,fireEvent,cleanup} from '@testing-library/react';
import {getFunctionName} from 'convex/server';
const state=vi.hoisted(()=>({authenticated:false,session:{enabled:true,kind:'signed_out',expiresAt:null},listeners:new Set(),calls:[]}));
function notify(){for(const fn of state.listeners)fn();}
const actions={
 'coach:status':async()=>({google:true,coach:false,speech:false}),
 'speech:ready':async()=>false,
 'speech:transcribe':async()=>{throw Error('Unavailable in interface test');},
};
vi.mock('convex/react',async()=>{
 const React=await import('react');
 const subscribe=fn=>{state.listeners.add(fn);return()=>state.listeners.delete(fn);};
 return {useConvexAuth:()=>({isAuthenticated:React.useSyncExternalStore(subscribe,()=>state.authenticated),isLoading:false}),
 useQuery:ref=>{const session=React.useSyncExternalStore(subscribe,()=>state.session);const name=getFunctionName(ref);if(name==='evaluator:session')return session;if(name==='huddles:history')return {page:[],isDone:true,continueCursor:''};return null;},
 useAction:ref=>actions[getFunctionName(ref)]??(async()=>null),useMutation:()=>async()=>null,useConvex:()=>({query:async()=>null})};
});
vi.mock('@convex-dev/auth/react',()=>({useAuthActions:()=>({signIn:async provider=>{
 state.calls.push(provider);state.authenticated=true;state.session={enabled:true,kind:provider==='evaluator'?'evaluator':'private',expiresAt:Date.now()+14400000};notify();
 },signOut:async()=>{state.calls.push('signOut');state.authenticated=false;state.session={enabled:true,kind:'signed_out',expiresAt:null};notify();}})}));
import {App} from '../src/App';
beforeEach(()=>{state.authenticated=false;state.session={enabled:true,kind:'signed_out',expiresAt:null};state.calls=[];window.history.replaceState(null,'','/');Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};window.matchMedia=()=>({matches:false});});
afterEach(()=>{cleanup();window.history.replaceState(null,'','/');});
test('landing exposes evaluator access alongside normal Google Login; closed access is explicit',async()=>{
 const view=render(<App/>);expect(screen.getByRole('button',{name:'Try Networth MAP'}).disabled).toBe(false);
 expect(screen.getByRole('button',{name:'Google Login'})).toBeTruthy();
 state.session={enabled:false,kind:'signed_out',expiresAt:null};view.rerender(<App/>);
 expect(screen.getByRole('button',{name:'Try Networth MAP'}).disabled).toBe(true);expect(screen.getByText(/evaluator access is currently closed/i)).toBeTruthy();
});
test('try route starts the real assessment with evaluator authentication and exposes all twelve steps',async()=>{
 window.history.replaceState(null,'','/try');render(<App/>);
 await waitFor(()=>expect(state.calls).toEqual(['evaluator']));
 expect(await screen.findByRole('heading',{name:'What is your income before tax?'})).toBeTruthy();
 expect(screen.getByRole('navigation',{name:'Your 12 steps'}).querySelectorAll('button')).toHaveLength(12);
 expect(screen.getByRole('button',{name:'Return to Google Login'})).toBeTruthy();
 expect(screen.getByText(/Real AI is used when connected/)).toBeTruthy();
});
test('expired evaluator access cannot open saved financial screens and Google Login first ends the temporary identity',async()=>{
 state.authenticated=true;state.session={enabled:true,kind:'expired',expiresAt:null};render(<App/>);
 expect(screen.getByText('Evaluator session ended')).toBeTruthy();expect(screen.queryByRole('navigation',{name:'Your 12 steps'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Return to Google Login'}));
 await waitFor(()=>expect(state.calls).toEqual(['signOut','google']));
});
