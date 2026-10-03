// Only classify safe provider fields. Never log request bodies, headers, messages or secrets.
export function providerFailure(error) {
  let status = null, code = null;
  const pending = [error], seen = new Set();
  for (let i = 0; i < 20 && pending.length; i++) {
    const current = pending.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    if (Number.isInteger(current.statusCode)) status = current.statusCode;
    if (typeof current.responseBody === 'string') {
      try {
        const value = JSON.parse(current.responseBody)?.error?.code;
        if (typeof value === 'string' && /^[a-z_]{1,60}$/.test(value)) code = value;
      } catch {}
    }
    pending.push(current.cause, current.lastError);
    if (Array.isArray(current.errors)) pending.push(...current.errors.slice(0,5));
  }
  const message = ['insufficient_quota','credit_balance_exhausted'].includes(code)
    ? 'OpenAI API credit or billing is not available yet. Your answer is still here.'
    : status === 401
      ? 'The OpenAI key was rejected. Check the key saved in Convex.'
      : status === 403
        ? 'This OpenAI key does not have access to the required model.'
        : status === 429
          ? 'OpenAI is busy or its request limit was reached. Please retry shortly.'
          : 'The coach could not complete its reply. Your answer is still here; please retry.';
  return {status,code,message};
}
