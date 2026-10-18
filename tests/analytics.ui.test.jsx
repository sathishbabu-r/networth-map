// @vitest-environment jsdom
import React from 'react';import {test,expect,vi,afterEach} from 'vitest';import {render,screen,fireEvent,cleanup} from '@testing-library/react';import {getFunctionName} from 'convex/server';
const state=vi.hoisted(()=>({access:false,data:null,calls:[]}));
vi.mock('convex/react',()=>({useQuery:(ref,args)=>{state.calls.push({name:getFunctionName(ref),args});return getFunctionName(ref).endsWith('analyticsAccess')?state.access:args==='skip'?undefined:state.data;}}));
import {AnalyticsDashboard} from '../src/AnalyticsDashboard';import {summarizeAnalytics} from '../shared/product-analytics';
afterEach(()=>{cleanup();state.calls=[];state.access=false;state.data=null;});
test('nonowners never request dashboard data',()=>{render(<AnalyticsDashboard/>);expect(screen.getByText(/approved owner Google account/)).toBeTruthy();expect(state.calls.find(x=>x.name.endsWith('analyticsDashboard')).args).toBe('skip');});
test('owner dashboard labels empty and sampled data honestly and changes filters',()=>{state.access=true;state.data={...summarizeAnalytics([]),sampled:true};render(<AnalyticsDashboard/>);expect(screen.getByText(/Partial sample/)).toBeTruthy();expect(screen.getByText(/No tracked events/)).toBeTruthy();expect(screen.getByText(/not tracked by this dashboard yet/)).toBeTruthy();fireEvent.change(screen.getByLabelText('Time window'),{target:{value:'7'}});fireEvent.change(screen.getByLabelText('Account type'),{target:{value:'evaluator'}});expect(state.calls.at(-1).args).toEqual({days:7,cohort:'evaluator'});});
