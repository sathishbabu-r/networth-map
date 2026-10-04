import React, { useState } from "react";
import { progressFromHistory } from "../shared/map-engine";
import { NetworthAssessment } from "./original-map/networth-assessment";
import "./original-map/original.css";
const money = n => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export function NetworthMap({saved,history,olderHistory=[],onOlder,loadingOlder,onChange,saving,mapError,onRetry,onDelete,onDraftStatus,locked}) {
  const [tab,setTab]=useState("Networth MAP");
  const rows=progressFromHistory([...(history?.page??[]),...olderHistory],saved);
  return <section className="networth-map replica-pane" aria-label="Your Networth MAP">
    <nav className="map-tabs replica-tabs" aria-label="MAP views">{["Networth MAP","Daily progress"].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}<span role="status">{saving?"Remembering…":saved?.content.map?"Remembered privately":""}</span></nav>
    {mapError&&<p className="error" role="alert">{mapError} <button className="text-button" onClick={onRetry}>Retry saving MAP</button></p>}
    <div className="original-map-scroll" hidden={tab!=="Networth MAP"}><div className="original-map"><fieldset disabled={locked}><NetworthAssessment startAtBlueprint memory={saved?.content.map} onChange={onChange} onDelete={onDelete} onDraftStatus={onDraftStatus}/></fieldset></div></div>
    {tab==="Daily progress"&&<div className="daily-progress"><h2>Small actions. Visible progress.</h2><p>Tell Huddle what happened. Action completion and financial results are recorded separately.</p>
      {!rows.length&&<p>Your first dated action will start this record.</p>}
      {rows.map(r=><article className="progress-item" key={`${r.text}-${r.dueDate}`}><div className="map-row"><strong>{r.text}</strong><span className="action-status">{r.outcome?.actionStatus.replaceAll("_"," ")||"Planned"}</span></div><small>Due {r.dueDate}{r.outcome&&` · Reported ${r.outcome.occurredOn}`}</small>{r.outcome&&<><p>{r.outcome.text}</p><p>{r.outcome.amount===null?"No realised amount reported":`${money(r.outcome.amount)} · ${r.outcome.impactType.replaceAll("_"," ")}`}</p></>}</article>)}
      {history&&!history.isDone&&<button className="secondary" disabled={loadingOlder} onClick={onOlder}>{loadingOlder?"Loading…":"Load earlier progress"}</button>}
      <p>A reported result does not automatically change a balance. Tell Huddle the updated balance when you know it.</p>
    </div>}
  </section>;
}
