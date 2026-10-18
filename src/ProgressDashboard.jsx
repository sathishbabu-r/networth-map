import React from 'react';
import { localDay } from '../shared/daily-progress.mjs';
import { supportedMapMetrics } from '../shared/map-engine';
import { impactLabels } from './DailyCheckIn';
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
const statusLabels = { completed: 'Completed', partial: 'Made progress', not_done: 'Not done yet' };
export function ProgressDashboard({ records, map, review, incompleteHistory, loadingOlder, onOlder, onCheckIn }) {
  const completed = records.filter(r => r.actionStatus === 'completed').length;
  const partial = records.filter(r => r.actionStatus === 'partial').length;
  const days = Array.from({ length: 14 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - 13 + index); return localDay(d); });
  const counts = days.map(day => records.filter(r => r.occurredOn === day && r.actionStatus === 'completed').length);
  const max = Math.max(1, ...counts);
  const networth = supportedMapMetrics(map).find(metric => metric.key === 'networth');
  const latestResult = records.find(r => r.impactType !== 'none' && r.amount !== null);
  return <section className="progress-dashboard journey-section" aria-labelledby="progress-title">
    <h1 id="progress-title">Your actions are becoming a story.</h1>
    <p>Step 12 · My Progress · Private to you</p>
    <p>{records.length ? `You have recorded ${records.length} check-in${records.length === 1 ? '' : 's'}. See what helped, and choose your next small step.` : 'Your first check-in will start your progress story. You do not need a perfect day to begin.'}</p>
    <dl className="progress-totals">
      <div><dt>Completed check-ins</dt><dd>{completed}</dd></div>
      <div><dt>Made progress</dt><dd>{partial}</dd></div>
      <div><dt>Current MAP net worth</dt><dd>{networth ? money(networth.value) : 'Not enough data'}</dd>{networth?.estimated && <small>Based on estimated entries</small>}</div>
    </dl>
    {incompleteHistory && <p role="status">These figures cover your loaded records. Load earlier progress for a fuller picture.</p>}
    <figure className="progress-activity">
      <figcaption>Completed check-ins over the last 14 days</figcaption>
      <div className="activity-bars" role="list" aria-label="Daily completed check-ins">
        {days.map((day, index) => <div className="activity-day" role="listitem" key={day} aria-label={`${day}: ${counts[index]} completed check-ins`}>
          <div className="activity-track"><span style={{ height: `${counts[index] / max * 100}%` }} /></div>
          <small aria-hidden="true">{day.slice(8)}</small>
        </div>)}
      </div>
      <p>Actions recorded, not wealth gained. Days without a check-in are unreported.</p>
    </figure>
    <section className="latest-result"><h2>Your latest reported financial result</h2>
      {latestResult ? <><strong>{money(latestResult.amount)}</strong><p>{impactLabels[latestResult.impactType]} · {latestResult.occurredOn}</p><p>{latestResult.action}</p></> : <p>No financial amount reported yet. Completing an action can still help you learn.</p>}
      <p>Reported results do not automatically update MAP balances.</p>
    </section>
    <div className="progress-journal-heading"><h2>Your check-in journal</h2><button type="button" className="primary" onClick={onCheckIn}>Record My Check-in</button></div>
    {!records.length && <p>Record what you did, what changed and what got in the way.</p>}
    <ol className="progress-journal">
      {records.map(record => <li key={record.key}>
        <div className="journal-date"><time dateTime={record.occurredOn}>{record.occurredOn}</time><span className={`journal-status ${record.actionStatus}`}>{statusLabels[record.actionStatus]}</span></div>
        <h3>{record.action}</h3><p>{record.text}</p>
        {record.amount !== null && <p className="journal-result">{impactLabels[record.impactType]}: {money(record.amount)}</p>}
      </li>)}
    </ol>
    {incompleteHistory && <button type="button" className="secondary" disabled={loadingOlder} onClick={onOlder}>{loadingOlder ? 'Loading…' : 'Load earlier progress'}</button>}
    <section className="dashboard-review"><h2>Your Financial Review</h2><p>Return to the wider picture. Update the review when your MAP changes.</p>{review}</section>
  </section>;
}
