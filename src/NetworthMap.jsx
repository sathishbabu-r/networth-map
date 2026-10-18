import React, { useEffect, useState } from 'react';
import { NetworthAssessment, completedAssessmentSteps } from './original-map/networth-assessment';
import { dailyProgressRecords } from '../shared/daily-progress.mjs';
import { DailyCheckIn } from './DailyCheckIn';
import { ProgressDashboard } from './ProgressDashboard';
import './original-map/original.css';
export function NetworthMap({ draftReview, onConfirmDraft, draftPublishing, allowEmailContact = true, review, saved, history, olderHistory = [], onOlder, loadingOlder, onChange, saving, mapError, onRetry, onDelete, onDraftStatus, locked, onCheckIn, onCoach }) {
  const [view, setView] = useState('map');
  const map = saved?.content.map;
  const complete = completedAssessmentSteps(map).slice(1).every(Boolean);
  const records = dailyProgressRecords([...(history?.page ?? []), ...olderHistory], saved);
  useEffect(() => { if (!complete) setView('map'); }, [complete]);
  useEffect(() => {
    const row = document.querySelector('.assessment-steps');
    const active = row?.querySelector("[aria-current='step']");
    if (!row || !active) return;
    const left = active.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - (row.clientWidth - active.clientWidth) / 2;
    row.scrollTo?.({ left: Math.max(0, left), behavior: 'auto' });
  }, [view]);
  function openView(next) {
    if (!complete || saving || locked) return;
    setView(next);
    document.querySelector('.original-map-scroll')?.scrollTo({ top: 0, behavior: 'auto' });
  }
  const additionalSteps = <>
    {[[11, 'Daily Check-in', 'check-in', 'Check-in'], [12, 'My Progress', 'progress', 'Progress']].map(([number, name, key, label]) => <li key={key}>
      <button type="button" disabled={!complete || saving || locked} aria-current={view === key ? 'step' : undefined}
        aria-label={`Step ${number}: ${name}${number === 11 && records.length ? ', completed' : ''}`}
        className={number === 11 && records.length ? 'step-completed' : ''} onClick={() => openView(key)}>
        <span className="step-marker" aria-hidden="true">{number === 11 && records.length ? <svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : number}</span>
        <span>{label}</span>
      </button>
    </li>)}
  </>;
  return <section className="networth-map replica-pane" aria-label="Your Networth MAP">
    <p className="map-save-status" role="status">{draftReview ? 'Unsaved draft — review and confirm below' : saving ? 'Remembering…' : map ? 'Remembered privately' : 'Your private Networth MAP'}</p>
    {draftReview && <section aria-label="Review financial snapshot"><h2>Review your financial snapshot</h2><p>These edits are not saved. Confirm only when the details, periods and estimates are correct.</p>{draftReview.map((line,i)=><p key={i}>{line}</p>)}<button disabled={locked || draftPublishing} onClick={onConfirmDraft}>Confirm financial snapshot</button></section>}
    {mapError && <p className="error" role="alert">{mapError} <button className="text-button" onClick={onRetry}>Retry saving MAP</button></p>}
    <div className="original-map-scroll"><div className="original-map"><fieldset disabled={locked}>
      <NetworthAssessment allowEmailContact={allowEmailContact} startAtBlueprint memory={map} onChange={onChange} onDelete={onDelete} onDraftStatus={onDraftStatus}
        financialReview={review} additionalSteps={additionalSteps} showContent={view === 'map'} onNavigate={() => setView('map')} />
      {complete && view === 'check-in' && <DailyCheckIn saved={saved} locked={locked || saving} onSave={onCheckIn} onSaved={() => setView('progress')} onCoach={onCoach} />}
      {complete && view === 'progress' && <ProgressDashboard records={records} map={map} review={review} incompleteHistory={history && !history.isDone} loadingOlder={loadingOlder} onOlder={onOlder} onCheckIn={() => openView('check-in')} />}
    </fieldset></div></div>
  </section>;
}
