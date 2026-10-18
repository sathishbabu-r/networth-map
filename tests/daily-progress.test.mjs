import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInContent, dailyProgressRecords } from '../shared/daily-progress.mjs';
const content = () => ({ concern: 'Synthetic test', facts: [{key:'cash',label:'Cash',kind:'exact',amount:1000,lower:null,upper:null,scope:'personal',period:'point_in_time',currency:'INR',asOf:'',note:''}], goal:{text:'Understand my spending',targetDate:null},action:{text:'Review recurring costs',dueDate:'2026-10-10'},outcome:null,map:{data:{monthlyNeeds:'50000'}} });
const values = () => ({ action:'Review recurring costs',goal:'Understand my spending',useExisting:true,status:'completed',date:'2026-10-10',change:'Reviewed subscriptions',obstacle:'',impactType:'none',amount:'',confirmed:true });
test('daily check-in needs confirmation and never changes MAP balances or invents a financial gain',()=>{
 const c=content(),v=values();const next=checkInContent(c,v,null,'2026-10-10');
 assert.deepEqual(next.map,c.map);assert.deepEqual(next.facts,c.facts);assert.deepEqual(next.action,c.action);assert.deepEqual(next.goal,c.goal);
 assert.equal(next.outcome.amount,null);assert.equal(next.outcome.impactType,'none');assert.equal(c.outcome,null);
 assert.throws(()=>checkInContent(c,{...v,confirmed:false},null,'2026-10-10'),/Confirm/);
});
test('realised zero is distinct from a missing financial result, and invalid/future data is rejected',()=>{
 const c=content(),v={...values(),impactType:'expense_reduction'};
 assert.throws(()=>checkInContent(c,v,null,'2026-10-10'),/actually changed/);
 assert.equal(checkInContent(c,{...v,amount:'0'},null,'2026-10-10').outcome.amount,0);
 for(const amount of ['-1','NaN','Infinity'])assert.throws(()=>checkInContent(c,{...v,amount},null,'2026-10-10'));
 for(const date of ['2026-02-30','2026-10-11'])assert.throws(()=>checkInContent(c,{...values(),date},null,'2026-10-10'));
});
test('daily journal removes MAP-save duplicates and same-day corrections but keeps different days',()=>{
 const first=checkInContent(content(),values(),null,'2026-10-10');
 const corrected={...first,outcome:{...first.outcome,actionStatus:'partial',text:'Only two subscriptions reviewed'}};
 const second={...first,outcome:{...first.outcome,occurredOn:'2026-10-09'}};
 const history=[{revision:1,newContent:second},{revision:2,newContent:first},{revision:3,newContent:first},{revision:4,newContent:corrected}];
 const records=dailyProgressRecords(history,{revision:4,content:corrected});
 assert.equal(records.length,2);assert.equal(records[0].actionStatus,'partial');assert.equal(records[1].occurredOn,'2026-10-09');
});
test('first check-in uses only an explicitly confirmed supplied MAP snapshot and records a chosen goal/action',()=>{
 const c={...content(),facts:[],goal:null,action:null};
 const v={...values(),useExisting:false};
 assert.throws(()=>checkInContent(c,v,null,'2026-10-10'),/Confirm your MAP assets/);
 const fact=content().facts[0];const saved=checkInContent(c,v,fact,'2026-10-10');
 assert.deepEqual(saved.facts,[fact]);assert.deepEqual(saved.goal,{text:v.goal,targetDate:null});assert.deepEqual(saved.map,c.map);
});
