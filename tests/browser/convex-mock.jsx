// Local browser fixtures for the real App UI. No Convex client or network writes.
import { useSyncExternalStore } from 'react';
import { getFunctionName } from 'convex/server';
import { emptyMap } from '../../shared/map-engine';
const listeners = new Set();
let session = { signedIn: true, saved: null };
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => { for (const fn of listeners) fn(); };
const snapshot = () => session;
const history = { page: [], isDone: true, continueCursor: '' };
export function setSignedIn(signedIn) { session = { ...session, signedIn }; notify(); }
export function useConvexAuth() {
  const state = useSyncExternalStore(subscribe, snapshot);
  return { isAuthenticated: state.signedIn, isLoading: false };
}
export function useQuery(ref, args) {
  const state = useSyncExternalStore(subscribe, snapshot);
  if (args === 'skip') return undefined;
  return getFunctionName(ref) === 'huddles:history' ? history : state.saved;
}
const actions = {
  'coach:status': async () => ({ google: true, coach: true, speech: true }),
  'speech:ready': async () => false,
  'speech:transcribe': async () => { throw new Error('Voice transcription is not connected in the local sample preview.'); },
  'coach:reply': async ({ messages }) => {
    const text = messages.at(-1)?.content ?? '';
    // Deliberately narrow fixture: a rupee amount with no unit conversion or AI.
    const match = text.match(/annual gross personal income is (\d+)/i);
    if (!match) return { text: 'What effective tax rate applies to that annual income?', proposal: null, revision: session.saved?.revision ?? 0, error: null };
    const map = structuredClone(session.saved?.content.map ?? emptyMap());
    map.data.grossPersonalIncome = match[1];
    map.step = 1;
    return { text: 'Sample answer received.', proposal: { ...(session.saved?.content ?? { concern: 'Sample MAP', facts: [], goal: null, action: null, outcome: null }), map }, revision: session.saved?.revision ?? 0, error: null };
  },
};
const mutations = {
  'huddles:save': async ({ content, expectedRevision }) => {
    if (expectedRevision !== (session.saved?.revision ?? 0)) throw new Error('Sample revision changed; retry.');
    const revision = expectedRevision + 1;
    session = { ...session, saved: { content: structuredClone(content), revision, complete: false } };
    notify(); return revision;
  },
  'huddles:remove': async () => { session = { ...session, saved: null }; notify(); },
  'productInsights:track': async () => null,
  'productInsights:submitFeedback': async () => null,
  'productInsights:completeMap': async () => 'sample-completion',
  'productInsights:submitCompletedMapEmail': async () => ({ emailStatus: 'created' }),
};
export function useAction(ref) {
  const fn = actions[getFunctionName(ref)];
  if (!fn) throw new Error('This action is not supported in the sample preview.');
  return fn;
}
export function useMutation(ref) {
  const fn = mutations[getFunctionName(ref)];
  if (!fn) throw new Error('This mutation is not supported in the sample preview.');
  return fn;
}
const client = { query: async () => history };
export function useConvex() { return client; }
