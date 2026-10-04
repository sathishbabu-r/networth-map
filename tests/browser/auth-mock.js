import { setSignedIn } from './convex-mock.jsx';
const actions = {
  signIn: async () => setSignedIn(true),
  signOut: async () => setSignedIn(false),
};
export function useAuthActions() { return actions; }
