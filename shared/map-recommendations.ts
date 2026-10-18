import {actionCategoryLabels, type Blueprint} from './networth-engine';
import {assessedMap} from './map-engine';
import type {MapMemory} from './map-schema';
export function mapRecommendations(blueprint:Blueprint) {
 return [
  ...blueprint.actionAssessments.map(a=>({id:`action-${a.id}`,category:actionCategoryLabels[a.category],title:a.action,observation:a.evidence,action:a.nextStep,reason:a.perspective,tradeoff:a.tradeoff,status:a.status,horizon:a.horizon})),
  ...blueprint.unaddressedFindings.map(f=>({id:`finding-${f.id}`,category:f.category,title:f.title,observation:f.observation,action:f.action,reason:f.reason,tradeoff:'Acting on this finding can compete with other priorities for available time and cash. Check the evidence and timing before choosing.',status:'finding',horizon:'discuss'})),
 ];
}
export function savedMapTopThree(map:MapMemory|null,revision:number) {
 return {revision,actions:map?mapRecommendations(assessedMap(map).blueprint).slice(0,3):[]};
}
export function asksAboutTopThree(message:string) {
 return !/\bI (?:commit|choose|have chosen|am choosing|will)\b/i.test(message) && /\btop\s*(?:3|three)\b/i.test(message) && /\b(?:actions?|start|begin|first|prioriti[sz]e|choose|pick)\b/i.test(message);
}
// The model may select a saved item, but cannot author, rename or reorder it.
export function renderTopThreeChoice(catalog:ReturnType<typeof savedMapTopThree>,selection:{revision:number;startingId:string|null}):string|null {
 if(selection.revision!==catalog.revision)return null;
 if(!catalog.actions.length&&selection.startingId!==null)return null;
 const chosen=catalog.actions.find(a=>a.id===selection.startingId);
 if(selection.startingId!==null&&!chosen)return null;
 if(chosen&&!chosen.title.trim())return null;
 if(chosen&&['not-supported','reconsider','more-information'].includes(chosen.status))return null;
 if(!catalog.actions.length)return 'Your saved MAP has no Top 3 actions to compare yet. What would you like to clarify before choosing a next step?';
 const list=catalog.actions.map((a,i)=>`${i+1}. ${a.title.trim()?`Saved action: “${a.title}”`:'Saved action description is missing'} — ${a.tradeoff}${['not-supported','reconsider','more-information'].includes(a.status)?' The MAP says this needs clarification before acting.':''}`).join('\n');
 return `Your saved MAP’s Top 3, in the displayed order:\n${list}\n${chosen?`A starting point to consider is action ${catalog.actions.indexOf(chosen)+1}: ${chosen.title}. ${chosen.status==='finding'?'This is an outstanding finding in your MAP':chosen.status==='refine'?'Your MAP marks this action for refinement before proceeding':'Your MAP supports this action for consideration'}; consider its trade-off above.`:'I would clarify the unresolved evidence before choosing a starting action.'} The choice remains yours. Which feels manageable this week?`;
}
