// Match the development SITE_URL before Google sign-in creates browser-local state.
export function canonicalLocalAppUrl(href, development) {
  const url = new URL(href);
  if (!development || url.protocol !== "http:" || url.hostname !== "localhost" || url.port !== "5173") return null;
  url.hostname = "127.0.0.1";
  return url.href;
}
