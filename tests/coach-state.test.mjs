import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCoachState } from "../shared/coach-state.mjs";
test("AI fact dates use the correct annual and monthly units without changing amounts",()=>{
 const result=normalizeCoachState({concern:"Build my MAP",map:{},facts:[{period:"annual",asOf:"2026-10-03",amount:2400000},{period:"monthly",asOf:"2026-10-03",amount:50000},{period:"point_in_time",asOf:"2026-10-03",amount:500000}]});
 assert.deepEqual(result.facts.map(f=>f.asOf),["2026","2026-10","2026-10-03"]);assert.deepEqual(result.facts.map(f=>f.amount),[2400000,50000,500000]);
});
test("a missing or impossible date is not invented or repaired silently",()=>{
 const p={concern:"Build my MAP",map:{},facts:[{period:"annual",asOf:""},{period:"monthly",asOf:"2026-02-31"}]};assert.deepEqual(normalizeCoachState(p).facts,p.facts);
});
test("a full MAP can start without a separate concern, while legacy concerns stay unchanged",()=>{
 assert.equal(normalizeCoachState({concern:"",map:{},facts:[]}).concern,"Building my Networth MAP");assert.equal(normalizeCoachState({concern:"",map:null,facts:[]}).concern,"");assert.equal(normalizeCoachState(null),null);
});

test("a remembered action is unchanged when stored object keys arrive in a different order",async()=>{
 const {sameAction}=await import("../shared/commitment.mjs");assert.equal(sameAction({text:"Review cash",dueDate:"2026-10-10"},{dueDate:"2026-10-10",text:"Review cash"}),true);assert.equal(sameAction({text:"Review cash",dueDate:"2026-10-10"},{text:"Review cash",dueDate:"2026-10-11"}),false);assert.equal(sameAction(null,undefined),true);
});

test("a MAP snapshot copies one supplied amount, preserves uncertainty and does not invent timing or a zero",async()=>{
 const {mapSnapshotFact}=await import("../shared/commitment.mjs");const map={data:{grossPersonalIncome:"2400000",monthlyNeeds:"",monthlyWants:"",annualInvesting:"",assets:[],liabilities:[]},estimates:["grossPersonalIncome"],unknowns:[]};
 const fact=mapSnapshotFact(map);assert.equal(fact.amount,2400000);assert.equal(fact.kind,"estimate");assert.equal(fact.period,"annual");assert.equal(fact.asOf,"");
 map.unknowns=["grossPersonalIncome"];assert.equal(mapSnapshotFact(map),null);map.data.grossPersonalIncome="";map.unknowns=[];assert.equal(mapSnapshotFact(map),null);
});
