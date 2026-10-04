import { validDate } from "./huddle.mjs";
// Match the existing fact format without changing amounts or inventing a date.
export function normalizeCoachState(proposal) {
 if (!proposal) return proposal;
 return {...proposal,concern:proposal.map && !proposal.concern.trim()?"Building my Networth MAP":proposal.concern,
  facts:proposal.facts.map(f=>{
   const fullDate=validDate(f.asOf),month=/^\d{4}-(0[1-9]|1[0-2])$/.test(f.asOf);
   return {...f,asOf:f.period==="annual"&&(fullDate||month)?f.asOf.slice(0,4):f.period==="monthly"&&fullDate?f.asOf.slice(0,7):f.asOf};
  })};
}
