import { validDate, validateContent } from './huddle.mjs';

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// One current report per action and day. MAP edits do not become new check-ins.
export function dailyProgressRecords(history, current) {
  const records = new Map();
  const ordered = [...history].sort((a, b) => a.revision - b.revision);
  for (const row of [...ordered, { newContent: current?.content, revision: current?.revision }]) {
    const content = row.newContent;
    if (!content?.action || !content.outcome) continue;
    const key = `${content.action.text.trim().toLowerCase()}|${content.action.dueDate}|${content.outcome.occurredOn}`;
    records.set(key, { key, action: content.action.text, goal: content.goal?.text, ...content.outcome });
  }
  return [...records.values()].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
}

export function checkInContent(content, values, snapshotFact, today = localDay()) {
  if (!content?.map) throw Error('Complete your MAP before recording a check-in.');
  if (!validDate(values.date) || values.date > today) throw Error('Choose today or an earlier real date.');
  if (!values.confirmed) throw Error('Confirm your check-in before saving.');
  const actionText = values.action.trim();
  const goalText = values.goal.trim();
  const change = values.change.trim();
  if (!actionText || !goalText || !change) throw Error('Add your action, goal and what changed.');
  const text = values.obstacle.trim() ? `${change} What got in the way: ${values.obstacle.trim()}` : change;
  if (text.length > 500) throw Error('Keep your result and obstacle together under 500 characters.');
  const amount = values.impactType === 'none' ? null : values.amount.trim() === '' ? null : Number(values.amount);
  if (values.impactType !== 'none' && amount === null) throw Error('Enter the amount that actually changed, or choose no amount reported.');
  const facts = content.facts.length ? content.facts : snapshotFact ? [snapshotFact] : [];
  if (!facts.length) throw Error('Confirm your MAP assets before recording an action.');
  const existingAction = values.useExisting && content.action;
  const next = {
    ...content,
    facts,
    goal: content.goal ?? { text: goalText, targetDate: null },
    action: existingAction ? content.action : { text: actionText, dueDate: values.date },
    outcome: { actionStatus: values.status, text, amount, impactType: values.impactType, occurredOn: values.date },
  };
  validateContent(next);
  return next;
}
