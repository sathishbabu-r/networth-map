// @vitest-environment jsdom
import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
const mock=vi.hoisted(()=>({report:null,previous:null,fail:false}));
vi.mock('convex/react',()=>({useQuery:()=>mock.previous,useAction:()=>async()=>{if(mock.fail)throw Error('Review unavailable');return JSON.stringify(mock.report);}}));
import {FinancialReview} from '../src/FinancialReview';
afterEach(()=>{cleanup();mock.fail=false;mock.previous=null;});
test('financial review shows missing evidence, offers coaching and marks results stale after MAP update',async()=>{
 const explore=vi.fn();mock.report={data_policy_version:"financial-integrity-v2",map_version:1,cfo:{story:'Your reported cash flow needs review.',insights:[{text:'Check the gap'}],strategic_gap:'Clarify priorities',attention_now:'Check costs',tradeoffs:[],no_action:'No transaction suggested',caveats:['Incomplete MAP']},verified:{state:'INSUFFICIENT_DATA',calculations:[]}};
 const view=render(<FinancialReview revision={1} onExplore={explore}/>);fireEvent.click(screen.getByText('Review my full MAP'));await waitFor(()=>expect(screen.getByText('Your reported cash flow needs review.')).toBeTruthy());fireEvent.click(screen.getByText('Ask Your Money Coach'));expect(explore).toHaveBeenCalledWith('Check the gap');view.rerender(<FinancialReview revision={2} onExplore={explore}/>);expect(screen.getByText(/Your MAP has changed/)).toBeTruthy();expect(screen.queryByText('Your reported cash flow needs review.')).toBeNull();
});
test('provider failure preserves review question and gives a retryable error',async()=>{mock.fail=true;render(<FinancialReview revision={1}/>);fireEvent.change(screen.getByLabelText('What would you like to understand?'),{target:{value:'My spending'}});fireEvent.click(screen.getByText('Explore this question'));await waitFor(()=>expect(screen.getByRole('alert').textContent).toBe('Review unavailable'));expect(screen.getByLabelText('What would you like to understand?').value).toBe('My spending');});

test('a saved review made before the unknown-value checks is withheld without changing records',()=>{
 const legacy={map_version:1,cfo:{story:'Old unsupported conclusion'},verified:{calculations:[]}};
 mock.previous={report:JSON.stringify(legacy)};
 render(<FinancialReview revision={1}/>);
 expect(screen.queryByText('Old unsupported conclusion')).toBeNull();
 expect(screen.getByText(/needs the current data checks/)).toBeTruthy();
 expect(JSON.parse(mock.previous.report)).toEqual(legacy);
});
