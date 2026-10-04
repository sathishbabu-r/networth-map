// @vitest-environment jsdom
import React from "react";
import { test,expect,vi,afterEach } from "vitest";
import { render,screen,fireEvent,waitFor,cleanup } from "@testing-library/react";
import { NetworthAssessment } from "../src/original-map/networth-assessment";
import { emptyAssessment } from "../shared/networth-engine";
import { memoryFromAssessment } from "../shared/map-engine";
const insights=vi.hoisted(()=>({track:()=>{},submitFeedback:async()=>{},markMapCompleted:async()=>"completion",submitCompletedMapEmail:async()=>({emailStatus:"created"})}));
vi.mock("../src/original-map/use-product-insights",()=>({useProductInsights:()=>insights}));
afterEach(cleanup);
const complete=()=>({...emptyAssessment,userType:"salaried",grossPersonalIncome:"2400000",effectiveTaxRate:"20",assets:[{id:"cash",description:"Savings",category:"cash",value:"500000",purpose:"investment",annualNetIncome:"10000"}],liabilities:[],hasNoLiabilitiesConfirmed:true,monthlyNeeds:"50000",monthlyWants:"20000",annualInvesting:"300000",visionLevel:"security",visionChoiceConfirmed:true,wealthGoals:["dreams"],wealthGoalDetails:{dreams:{description:"Travel",amount:"200000",targetYear:"2030",priority:"important",flexibility:"date"}},wealthMilestoneChoice:"not-yet",moneyPurpose:"Peace of mind",wealthMotivation:"Family",proposedActions:[{id:"one",category:"increase-investing",description:"Review investing",targetDate:"2026-10-10"}]});
test("all original screens render from the same account memory, including complete final results",async()=>{
 Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};
 for(let step=0;step<=11;step++){
  const view=render(<NetworthAssessment memory={memoryFromAssessment(complete(),null,step)} onChange={()=>{}}/>);
  expect(screen.getAllByRole("heading",{level:1}).length).toBeGreaterThan(0);
  if(step===11){expect(screen.getByRole("button",{name:/print/i})).toBeTruthy();expect(screen.getByRole("button",{name:/copy your next moves/i})).toBeTruthy();}
  view.unmount();
 }
});
test("editing an original MAP field is remembered and survives reopening",async()=>{
 const onChange=vi.fn();const memory=memoryFromAssessment(complete(),null,4);
 const view=render(<NetworthAssessment memory={memory} onChange={onChange}/>);
 fireEvent.change(screen.getByDisplayValue("50,000"),{target:{value:"60000"}});
 await waitFor(()=>expect(onChange).toHaveBeenCalled(),{timeout:2000});
 const [data,step]=onChange.mock.calls.at(-1);expect(data.monthlyNeeds).toBe("60000");expect(step).toBe(4);
 view.unmount();render(<NetworthAssessment memory={memoryFromAssessment(data,memory,step)} onChange={()=>{}}/>);expect(screen.getByDisplayValue("60,000")).toBeTruthy();
});

test("a save acknowledgement does not replace a newer draft in the original MAP",async()=>{
 const onChange=vi.fn(),memory=memoryFromAssessment(complete(),null,4);
 const view=render(<NetworthAssessment memory={memory} onChange={onChange}/>);
 fireEvent.change(screen.getByDisplayValue("50,000"),{target:{value:"60000"}});
 await waitFor(()=>expect(onChange).toHaveBeenCalled(),{timeout:2000});
 const [sent,step]=onChange.mock.calls[0];
 fireEvent.change(screen.getByDisplayValue("60,000"),{target:{value:"70000"}});
 view.rerender(<NetworthAssessment memory={memoryFromAssessment(sent,memory,step)} onChange={onChange}/>);
 expect(screen.getByDisplayValue("70,000")).toBeTruthy();
 await waitFor(()=>expect(onChange).toHaveBeenCalledTimes(2),{timeout:2000});expect(onChange.mock.calls[1][0].monthlyNeeds).toBe("70000");
});

test("starting Blueprint skips the duplicate welcome without changing saved figures", () => {
 const onChange=vi.fn();const memory=memoryFromAssessment(complete(),null,0);
 const view=render(<NetworthAssessment startAtBlueprint memory={memory} onChange={onChange}/>);
 expect(screen.getByRole("heading",{name:"What income do you take home?"})).toBeTruthy();
 expect(screen.queryByRole("button",{name:/Build My Networth Map/i})).toBeNull();
 expect(onChange).not.toHaveBeenCalled();
 view.rerender(<NetworthAssessment startAtBlueprint memory={{...memory,data:{...memory.data,grossPersonalIncome:"3000000"}}} onChange={onChange}/>);
 expect(screen.getByRole("heading",{name:"What income do you take home?"})).toBeTruthy();
 expect(onChange).not.toHaveBeenCalled();
});
