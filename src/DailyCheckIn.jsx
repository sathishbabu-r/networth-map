import React, { useState } from 'react';
import { supportedMapMetrics } from '../shared/map-engine';
import { checkInContent, localDay } from '../shared/daily-progress.mjs';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
export const impactLabels = {
  none: 'No amount reported', income: 'Income received', expense_reduction: 'Expense reduced',
  debt_repayment: 'Debt repaid', savings_allocation: 'Money moved to savings', receivables_collection: 'Receivables collected',
};
export function DailyCheckIn({ saved, locked, onSave, onSaved, onCoach }) {
  const content = saved.content;
  const [values, setValues] = useState(() => ({
    action: content.action?.text ?? '', useExisting: Boolean(content.action),
    goal: content.goal?.text ?? content.map.data.wealthGoalDetails.find(g => g.description.trim())?.description ?? content.map.data.moneyPurpose ?? '',
    status: 'completed', date: localDay(), change: '', obstacle: '', impactType: 'none', amount: '', confirmed: false,
  }));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const patch = changes => setValues(v => ({ ...v, ...changes, confirmed: false }));
  const assets = supportedMapMetrics(content.map).find(metric => metric.key === 'assets');
  const snapshot = assets ? {
    key: 'map_total_assets', label: 'Total assets from my MAP', kind: assets.estimated ? 'estimate' : 'exact',
    amount: assets.value, lower: null, upper: null, scope: 'personal', period: 'point_in_time', currency: 'INR', asOf: '',
    note: 'Calculated from confirmed MAP asset entries. Balance as-of date not supplied.',
  } : null;
  async function submit(event) {
    event.preventDefault(); if (busy || locked) return;
    setError('');
    try {
      const next = checkInContent(content, values, snapshot);
      setBusy(true);
      await onSave({ content: next, expectedRevision: saved.revision });
      onSaved();
    } catch (e) { setError(e.message || 'Your check-in could not be saved. Your words are still here.'); }
    finally { setBusy(false); }
  }
  return <section className="daily-check-in journey-section" aria-labelledby="check-in-title">
    <h1 id="check-in-title">One action. A little more clarity.</h1>
    <p>Step 11 · Daily check-in</p>
    <p>What did you do, what changed, and what can you learn from it?</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy || locked}>
        {content.action && <label className="check-in-toggle"><input type="checkbox" checked={!values.useExisting} onChange={e => patch({ useExisting: !e.target.checked, action: e.target.checked ? '' : content.action.text })} /> Record a different action</label>}
        <label className="field">Your action<input value={values.action} readOnly={values.useExisting} maxLength={500} required onChange={e => patch({ action: e.target.value })} /></label>
        {content.action && !values.useExisting && <p className="check-in-help">Your earlier commitment stays in your private history.</p>}
        {!content.goal && <label className="field">Why this matters to you<input value={values.goal} required maxLength={500} onChange={e => patch({ goal: e.target.value })} /></label>}
        {content.goal && <p className="check-in-help">Your goal: {content.goal.text}</p>}
        <div className="check-in-pair">
          <label className="field">Date<input type="date" max={localDay()} required value={values.date} onChange={e => patch({ date: e.target.value })} /></label>
          <label className="field">How did it go?<select value={values.status} onChange={e => patch({ status: e.target.value })}><option value="completed">Completed</option><option value="partial">Made progress</option><option value="not_done">Not done yet</option></select></label>
        </div>
        <label className="field">What changed?<textarea value={values.change} required maxLength={350} onChange={e => patch({ change: e.target.value })} placeholder="What happened, or what did you learn?" /></label>
        <label className="field">What got in the way? (optional)<textarea value={values.obstacle} maxLength={120} onChange={e => patch({ obstacle: e.target.value })} /></label>
        <div className="check-in-pair">
          <label className="field">Actual financial result<select value={values.impactType} onChange={e => patch({ impactType: e.target.value, amount: '' })}>{Object.entries(impactLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          {values.impactType !== 'none' && <label className="field">Amount actually realised (₹)<input type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="any" required value={values.amount} onChange={e => patch({ amount: e.target.value })} /></label>}
        </div>
        <p className="check-in-help">Completing an action does not automatically change your net worth or MAP balances.</p>
        {!content.facts.length && snapshot && <p className="check-in-help">MAP snapshot: {money(snapshot.amount)} total assets{assets.estimated ? ' (estimated)' : ''}, calculated from your entries. The balance date has not been supplied.</p>}
        <label className="check-in-toggle"><input type="checkbox" checked={values.confirmed} onChange={e => setValues(v => ({ ...v, confirmed: e.target.checked }))} /> I confirm this check-in{!content.facts.length ? ' and the MAP snapshot above' : ''}.</label>
        <button className="primary" type="submit" disabled={!values.confirmed}>{busy ? 'Saving your check-in…' : 'Save My Check-in'}</button>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
    <button className="text-button" type="button" onClick={onCoach}>Ask Your Money Coach</button>
  </section>;
}
