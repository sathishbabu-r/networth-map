// @vitest-environment jsdom
import React from "react";
import { test,expect,vi,afterEach } from "vitest";
import { render,screen,fireEvent,waitFor,cleanup,within } from "@testing-library/react";
import { NetworthAssessment } from "../src/original-map/networth-assessment";
import { emptyAssessment } from "../shared/networth-engine";
import { memoryFromAssessment } from "../shared/map-engine";
const insights=vi.hoisted(()=>({track:()=>{},submitFeedback:async()=>{},markMapCompleted:vi.fn(async()=>"completion"),submitCompletedMapEmail:async()=>({emailStatus:"created"})}));
vi.mock("../src/original-map/use-product-insights",()=>({useProductInsights:()=>insights}));
afterEach(cleanup);
const complete=()=>({...emptyAssessment,userType:"salaried",grossPersonalIncome:"2400000",effectiveTaxRate:"20",assets:[{id:"cash",description:"Savings",category:"cash",value:"500000",purpose:"investment",annualNetIncome:"10000"}],liabilities:[],hasNoLiabilitiesConfirmed:true,monthlyNeeds:"50000",monthlyWants:"20000",annualInvesting:"300000",visionLevel:"security",visionChoiceConfirmed:true,wealthGoals:["dreams"],wealthGoalDetails:{dreams:{description:"Travel",amount:"200000",targetYear:"2030",priority:"important",flexibility:"date"}},wealthMilestoneChoice:"not-yet",moneyPurpose:"Peace of mind",wealthMotivation:"Family",proposedActions:[{id:"one",category:"increase-investing",description:"Review investing",targetDate:"2026-10-10"}]});
test("all original screens render from the same account memory, including complete final results",async()=>{
 Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};
 for(let step=0;step<=11;step++){
  const view=render(<NetworthAssessment memory={memoryFromAssessment(complete(),null,step)} onChange={()=>{}}/>);
  expect(screen.getAllByRole("heading",{level:1}).length).toBeGreaterThan(0);
  if(step===11){expect(within(screen.getByRole("navigation",{name:"Your 10 MAP steps"})).getAllByRole("button",{name:/completed/})).toHaveLength(10);expect(screen.getByRole("button",{name:"Print or Save MAP"})).toBeTruthy();expect(screen.getByRole("button",{name:/copy your next moves/i})).toBeTruthy();}
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
 expect(screen.getByRole("heading",{name:"What is your income before tax?"})).toBeTruthy();
 expect(screen.queryByRole("button",{name:/Build My Networth Map/i})).toBeNull();
 expect(onChange).not.toHaveBeenCalled();
 view.rerender(<NetworthAssessment startAtBlueprint memory={{...memory,data:{...memory.data,grossPersonalIncome:"3000000"}}} onChange={onChange}/>);
 expect(screen.getByRole("heading",{name:"What is your income before tax?"})).toBeTruthy();
 expect(onChange).not.toHaveBeenCalled();
});

test("returning to a remembered MAP does not repeat the quick-start popup", () => {
 render(<NetworthAssessment startAtBlueprint memory={memoryFromAssessment(complete(),null,4)} onChange={()=>{}}/>);
 expect(screen.queryByRole("dialog",{name:"Your best estimates are enough."})).toBeNull();
 expect(screen.getByRole("heading",{name:"What does your life cost?"})).toBeTruthy();
});

test('money entry preserves decimal rupees and rejects negative or pasted non-money text',async()=>{
 const onChange=vi.fn();render(<NetworthAssessment memory={memoryFromAssessment(complete(),null,4)} onChange={onChange}/>);
 const field=screen.getByDisplayValue('50,000');
 fireEvent.change(field,{target:{value:'100.50'}});
 await waitFor(()=>expect(onChange).toHaveBeenCalled());
 expect(onChange.mock.calls.at(-1)[0].monthlyNeeds).toBe('100.50');
 for(const value of ['-100','1e3','₹100','100abc']){
  fireEvent.change(field,{target:{value}});
  expect(field.value).toBe(value);
  expect(screen.getByText(/Enter a non-negative rupee amount/)).toBeTruthy();
 }
 fireEvent.change(field,{target:{value:'1,00,000'}});
 await waitFor(()=>expect(onChange.mock.calls.at(-1)[0].monthlyNeeds).toBe('100000'));
 expect(screen.queryByText(/Enter a non-negative rupee amount/)).toBeNull();
});

import {NetworthMap} from '../src/NetworthMap';
test('a saved category-less Coach action keeps the existing check-in journal reachable after reopen',()=>{
 const map=memoryFromAssessment(complete(),null,11);map.data.proposedActions[0].category='';
 const saved={revision:2,content:{map,facts:[],goal:{text:'Understand my money',targetDate:null},action:{text:'Review emergency savings',dueDate:'2026-10-10'},outcome:{text:'Reviewed the plan',actionStatus:'completed',impactType:'none',amount:null,occurredOn:'2026-10-10'}}};
 render(<NetworthMap saved={saved} history={{page:[],isDone:true}} onChange={()=>{}}/>);
 const progress=screen.getByRole('button',{name:'Step 12: My Progress'});expect(progress.disabled).toBe(false);
 fireEvent.click(progress);expect(screen.getByRole('heading',{name:'Review emergency savings'})).toBeTruthy();
 expect(saved.content.map.data.proposedActions[0].category).toBe('');
});

test('disposable evaluator results explain email contact requires Google Login instead of offering a failing form',()=>{
 render(<NetworthAssessment memory={memoryFromAssessment(complete(),null,11)} onChange={()=>{}} allowEmailContact={false}/>);
 expect(screen.queryByRole('button',{name:'Submit Email'})).toBeNull();
 expect(screen.queryByRole('textbox',{name:'Email address'})).toBeNull();
 expect(screen.getByText('Use Google Login before requesting email contact.')).toBeTruthy();
});

test('quick-start keyboard focus stays inside the open dialog and Escape closes it',()=>{
 render(<NetworthAssessment startAtBlueprint memory={null} onChange={()=>{}}/>);
 const dialog=screen.getByRole('dialog',{name:'Your best estimates are enough.'});
 const start=within(dialog).getByRole('button',{name:/Start My Blueprint/});
 const close=within(dialog).getByRole('button',{name:'Close quick start'});
 start.focus();fireEvent.keyDown(start,{key:'Tab'});expect(document.activeElement).toBe(close);
 fireEvent.keyDown(close,{key:'Tab',shiftKey:true});expect(document.activeElement).toBe(start);
 fireEvent.keyDown(start,{key:'Escape'});expect(screen.queryByRole('dialog',{name:'Your best estimates are enough.'})).toBeNull();
});


test('evaluator Generate My MAP waits for its successful saved acknowledgement before completeMap',async()=>{
 insights.markMapCompleted.mockClear();
 const onChange=vi.fn();const memory=memoryFromAssessment(complete(),null,10);
 const view=render(<NetworthAssessment allowEmailContact={false} memory={memory} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:/Generate My MAP/}));
 expect(screen.getByRole('button',{name:'Print or Save MAP'})).toBeTruthy();
 expect(insights.markMapCompleted).not.toHaveBeenCalled();
 await waitFor(()=>expect(onChange).toHaveBeenCalled(),{timeout:2000});
 const [data,step]=onChange.mock.calls.at(-1);expect(step).toBe(11);
 expect(insights.markMapCompleted).not.toHaveBeenCalled();
 view.rerender(<NetworthAssessment allowEmailContact={false} memory={memoryFromAssessment(data,memory,step)} onChange={onChange}/>);
 await waitFor(()=>expect(insights.markMapCompleted).toHaveBeenCalledTimes(1));
 view.rerender(<NetworthAssessment allowEmailContact={false} memory={memoryFromAssessment(data,memory,step)} onChange={onChange}/>);
 expect(insights.markMapCompleted).toHaveBeenCalledTimes(1);
});
