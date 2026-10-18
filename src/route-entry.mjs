export function isDemoPath(pathname) { return /^\/demo(?:\/|$)/.test(pathname); }
export function loadEntry(pathname, loaders) {
  if (isDemoPath(pathname) && typeof window !== "undefined") window.history.replaceState(null, "", "/");
  if (typeof __LOCAL_TEST_MODE__ !== "undefined" && __LOCAL_TEST_MODE__) return loaders ? loaders.test() : import("../local-test/entry.jsx");
  return loaders ? loaders.production() : import("./production-entry.jsx");
}
