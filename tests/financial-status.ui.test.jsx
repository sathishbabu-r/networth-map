// @vitest-environment jsdom
import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup,within} from '@testing-library/react';
import {NetworthAssessment} from '../src/original-map/networth-assessment';
import {emptyMap} from '../shared/map-engine';
vi.mock('../src/original-map/use-product-insights',()=>({useProductInsights:()=>({track:()=>{}})}));
afterEach(cleanup);
test('blank asset preview does not display invented zero balances',()=>{const m=emptyMap();Object.assign(m.data,{userType:"salaried",grossPersonalIncome:"1200000",effectiveTaxRate:"10"});m.step=2;render(<NetworthAssessment memory={m} onChange={()=>{}}/>);const preview=screen.getByRole('region',{name:'Live net worth estimate'});expect(preview.textContent).not.toContain('₹0');expect(preview.textContent).toContain('Not provided');});
test('confirmed no debt displays zero while net worth stays incomplete',()=>{const m=emptyMap();Object.assign(m.data,{userType:"salaried",grossPersonalIncome:"1200000",effectiveTaxRate:"10"});m.step=3;m.data.hasNoLiabilitiesConfirmed=true;render(<NetworthAssessment memory={m} onChange={()=>{}}/>);const preview=screen.getByRole('region',{name:'Live net worth estimate'});expect(preview.textContent).toContain('Liabilities ₹0');expect(preview.textContent).toContain('Not provided');});
test('blank financial plan explains missing sections and suppresses financial conclusions',()=>{const m=emptyMap();Object.assign(m.data,{userType:"salaried",grossPersonalIncome:"1200000",effectiveTaxRate:"10"});m.step=6;render(<NetworthAssessment memory={m} onChange={()=>{}}/>);expect(screen.getByText('Your financial picture is incomplete')).toBeTruthy();expect(screen.queryByText('₹0')).toBeNull();expect(screen.getByText(/Complete these MAP sections/).textContent).toContain('Liabilities');expect(screen.queryByText('Your liquidity coverage')).toBeNull();});
test('blank annual asset income does not display a zero yield',()=>{const m=emptyMap();Object.assign(m.data,{userType:"salaried",grossPersonalIncome:"1200000",effectiveTaxRate:"10"});m.step=2;m.data.assets=[{id:'cash',description:'Savings',category:'cash',value:'100000',purpose:'personal',annualNetIncome:''}];render(<NetworthAssessment memory={m} onChange={()=>{}}/>);expect(document.querySelector('.yield-field output').textContent).toBe('Not provided');});
test('estimated asset and net worth are labelled and remain unchanged on opening',()=>{const m=emptyMap();Object.assign(m.data,{userType:"salaried",grossPersonalIncome:"1200000",effectiveTaxRate:"10"});m.step=2;m.covered=['own','owe'];m.data.hasNoLiabilitiesConfirmed=true;m.data.assets=[{id:'cash',description:'Savings',category:'cash',value:'100000',purpose:'personal',annualNetIncome:'0'}];m.estimates=['assets.cash.value'];const change=vi.fn();render(<NetworthAssessment memory={m} onChange={change}/>);expect(within(screen.getByRole('region',{name:'Live net worth estimate'})).getAllByText(/estimate/).length).toBeGreaterThan(1);expect(change).not.toHaveBeenCalled();});
import {fireEvent,waitFor} from '@testing-library/react';
test('new liabilities start with unknown repayment and do not silently persist a zero',async()=>{
 const m=emptyMap();Object.assign(m.data,{userType:'salaried',grossPersonalIncome:'1200000',effectiveTaxRate:'10'});m.step=3;const change=vi.fn();render(<NetworthAssessment memory={m} onChange={change}/>);
 fireEvent.click(screen.getByRole('button',{name:'+ Personal Loan'}));
 const repayment=screen.getByRole('textbox',{name:/Annual Repayment/});expect(repayment.value).toBe('');expect(repayment.placeholder).toBe('Not provided');
 await waitFor(()=>expect(change).toHaveBeenCalled(),{timeout:2000});expect(change.mock.calls.at(-1)[0].liabilities[0].annualRepayment).toBe('');
});

import {financialStatus} from '../shared/financial-status';
import {assessmentStepValidation} from '../src/original-map/networth-assessment';
test('Savings cash asset worth 50,00,000 with zero income visibly requires Primary Use and clears Assets after selection',async()=>{
 const m=emptyMap();Object.assign(m.data,{userType:'salaried',grossPersonalIncome:'1200000',effectiveTaxRate:'10',monthlyNeeds:'30000',monthlyWants:'10000',annualInvesting:'120000'});
 m.covered=['earn','own','owe','spend','invest'];m.step=2;
 m.data.assets=[{id:'savings',category:'cash',description:'Savings',value:'5000000',annualNetIncome:'0',purpose:''}];
 m.data.liabilities=[{id:'loan',type:'personal',classification:'personal',description:'Loan',value:'100000',interestRate:'10',annualRepayment:'12000',repaymentIncludedInNeeds:false}];
 expect(financialStatus(m).missing).toEqual(['own: asset purpose']);
 expect(assessmentStepValidation(m.data,2).fields).toContain('asset-savings-purpose');
 render(<NetworthAssessment memory={m} onChange={()=>{}}/>);
 Element.prototype.scrollIntoView=()=>{};
 const group=screen.getByRole('group',{name:'Primary Use (required)'});
 expect(group.getAttribute('aria-invalid')).toBe('true');
 expect(within(group).getByRole('alert').textContent).toBe('Choose Investments or Personal / Lifestyle for this asset to complete your MAP.');
 expect(screen.getByRole('textbox',{name:/Current Value/}).value).toBe('50,00,000');
 fireEvent.click(screen.getByRole('button',{name:/Add My Liabilities/}));
 await waitFor(()=>expect(document.activeElement).toBe(within(group).getByRole('button',{name:'Investments'})));
 fireEvent.click(within(group).getByRole('button',{name:'Personal / Lifestyle'}));
 expect(screen.queryByText('Choose Investments or Personal / Lifestyle for this asset to complete your MAP.')).toBeNull();
 m.data.assets[0].purpose='personal';
 expect(assessmentStepValidation(m.data,2).fields).toEqual([]);
 expect(financialStatus(m).missing).toEqual([]);expect(financialStatus(m).ready).toBe(true);
});
