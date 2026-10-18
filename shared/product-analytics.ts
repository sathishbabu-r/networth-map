export type AnalyticsEvent = {userId:string;sessionId:string;event:string;step?:number;device:string;validationCode?:string;_creationTime:number;generationRevision?:number};
export function summarizeAnalytics(events: AnalyticsEvent[]) {
 const key=(e:AnalyticsEvent)=>JSON.stringify([e.userId,e.sessionId]);
 const sessions=new Set(events.map(key));
 const started=new Set(events.filter(e=>e.event==='assessment_started').map(key));
 const generations=events.filter(e=>e.event==='map_generated'&&e.generationRevision!==undefined);
 const completed=new Set(generations.map(key));
 const finishedStarts=[...started].filter(s=>completed.has(s)).length;
 const counts=(field:'event'|'device'|'validationCode')=>{const map=new Map<string,number>();for(const e of events){const value=e[field];if(value)map.set(value,(map.get(value)??0)+1);}return [...map].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));};
 return {events:events.length,sessions:sessions.size,started:started.size,generated:completed.size,generationEvents:generations.length,generationUsers:new Set(generations.map(e=>e.userId)).size,legacyGenerationEvents:events.filter(e=>e.event==='map_generated'&&e.generationRevision===undefined).length,completedStarts:finishedStarts,completionRate:started.size?finishedStarts/started.size:null,
 steps:Array.from({length:12},(_,step)=>{const viewed=new Set(events.filter(e=>e.step===step&&e.event==='step_viewed').map(key));const done=new Set(events.filter(e=>e.step===step&&e.event==='step_completed').map(key));return {step,viewed:viewed.size,completed:done.size,notCompleted:[...viewed].filter(s=>!done.has(s)).length,validationErrors:events.filter(e=>e.step===step&&e.event==='validation_error').length};}),eventCounts:counts('event'),devices:counts('device'),errors:counts('validationCode')};
}
