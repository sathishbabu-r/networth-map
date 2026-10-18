// ConvexError data is intentionally public; generic server errors hide private details.
export function userFacingError(error, fallback) {
 if (typeof error?.data === 'string') return error.data;
 const message = error?.message;
 return typeof message === 'string' && !/\[CONVEX|Request ID:|Called by client|Server Error/.test(message) ? message : fallback;
}
