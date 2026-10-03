// Ignore object-key and fact ordering when comparing already reviewed information.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}
export function sameConfirmedContent(proposal, confirmed) {
  if (!proposal || !confirmed) return false;
  const normalized = value => stable({ ...value, facts: [...value.facts].sort((a, b) => `${a.key}:${a.scope}:${a.period}`.localeCompare(`${b.key}:${b.scope}:${b.period}`)) });
  return JSON.stringify(normalized(proposal)) === JSON.stringify(normalized(confirmed));
}
export function nextHuddleQuestion(content) {
  if (content.action) return "What happened with your action?";
  if (content.goal) return "What's one realistic action you can take this week?";
  return "What would you like to achieve?";
}
