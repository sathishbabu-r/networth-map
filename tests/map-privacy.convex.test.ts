import {emptyMap} from "../shared/map-engine";
import { test,expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules=import.meta.glob("../convex/**/*.{ts,js}");
test("original feedback and optional email stay inside each account, export and delete",async()=>{
 const t=convexTest(schema,modules);const [aId,bId]=await t.run(async ctx=>[await ctx.db.insert("users",{name:"A"}),await ctx.db.insert("users",{name:"B"})]);const a=t.withIdentity({subject:aId+"|a"}),b=t.withIdentity({subject:bId+"|b"});
 await expect(t.mutation(api.productInsights.completeMap,{sessionId:"test",device:"desktop"})).rejects.toThrow("Sign in first");
 const map=emptyMap();map.step=11;map.covered=['earn','own','owe','spend','invest'];Object.assign(map.data,{userType:'professional',grossPersonalIncome:'1200000',effectiveTaxRate:'20',monthlyNeeds:'30000',monthlyWants:'10000',annualInvesting:'100000',hasNoLiabilitiesConfirmed:true,assets:[{id:'cash',description:'Synthetic cash',category:'cash',value:'500000',purpose:'investment',annualNetIncome:'0'}]});
 await a.mutation(api.huddles.save,{content:{concern:'Synthetic completed MAP for privacy regression',facts:[],goal:null,action:null,outcome:null,map},expectedRevision:0,analytics:{sessionId:'test',device:'desktop'}});
 const completion=await a.mutation(api.productInsights.completeMap,{sessionId:"test",device:"desktop"});
 await expect(b.mutation(api.productInsights.submitCompletedMapEmail,{email:"fiction@example.com",submittedAt:Date.now(),completionEventId:completion})).rejects.toThrow("completed MAP");
 await a.mutation(api.productInsights.submitCompletedMapEmail,{email:"fiction@example.com",submittedAt:Date.now(),completionEventId:completion});
 await a.mutation(api.productInsights.submitFeedback,{sessionId:"test",device:"desktop",step:4,category:"confusing",message:"The spending label is unclear"});
 await expect(a.mutation(api.productInsights.submitFeedback,{sessionId:"test",device:"desktop",step:4,category:"confusing",message:"My balance is 5000"})).rejects.toThrow("remove financial figures");
 for(const table of ["productInsightEvents","productFeedback","completedMapEmailSignups"] as const){expect((await a.query(api.productInsights.exportRows,{table,paginationOpts:{numItems:50,cursor:null}})).page).toHaveLength(1);expect((await b.query(api.productInsights.exportRows,{table,paginationOpts:{numItems:50,cursor:null}})).page).toHaveLength(0);}
 await a.mutation(api.huddles.remove,{});await t.finishAllScheduledFunctions(()=>Promise.resolve());
 for(const table of ["productInsightEvents","productFeedback","completedMapEmailSignups"] as const)expect((await a.query(api.productInsights.exportRows,{table,paginationOpts:{numItems:50,cursor:null}})).page).toHaveLength(0);
});
