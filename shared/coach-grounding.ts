import type { MapMemory } from './map-schema';
import { assessedMap, supportedMapMetrics } from './map-engine';
import { financialStatus, type FinancialValue } from './financial-status';
import { calculateInsights } from './financial.mjs';

export type CoachFigureRejection = {
 numericString:string|null; metric:string|null; period:Period|null; reason:string; revision:number;
 expectedMetric:string|null; expectedAmount:number|null; expectedPeriod:Period|null;
 currency:'INR'|null; unit:'INR'|'percent'|null; actualUnit:'INR'|'percent'|null; actualCurrency:'INR'|'USD'|'EUR'|'GBP'|'JPY'|null;
};
type RejectionDetail=Pick<CoachFigureRejection,'numericString'|'metric'|'period'|'reason'|'revision'>;
// Log only one identified metric, never the source catalog, row ids or prose.
function rejectionDetail(detail:RejectionDetail,sources:CoachFinancialSource[]):CoachFigureRejection {
 const matches=detail.metric?sources.filter(s=>s.id===detail.metric):[];
 const candidates=matches.length?matches:detail.metric?sourceForMetric(detail.metric,detail.period??undefined,sources):[];
 const source=candidates.length===1?candidates[0]:null;
 const amount=source?(detail.period===source.period||!detail.period?source.value:detail.period==='monthly'&&source.period==='annual'?source.value/12:detail.period==='annual'&&source.period==='monthly'?source.value*12:null):null;
 return {...detail,numericString:detail.metric&&detail.numericString&&detail.numericString.length<=128?detail.numericString:null,
  expectedMetric:source?.id??null,expectedAmount:amount,expectedPeriod:source?.period??null,
  currency:source?.currency??null,unit:source?.unit??null,actualUnit:detail.numericString?/%|percent/i.test(detail.numericString)?'percent':'INR':null,actualCurrency:!detail.numericString?null:/\$|USD/i.test(detail.numericString)?'USD':/€|EUR/i.test(detail.numericString)?'EUR':/£|GBP/i.test(detail.numericString)?'GBP':/¥/.test(detail.numericString)?'JPY':'INR'};
}
type Period = 'monthly' | 'annual' | 'point_in_time';
type Fact = {key:string; kind:string; amount:number|null; scope:string; period:Period; currency:string; asOf:string};
export type CoachFinancialSource = {
 id:string; metric:string; value:number; unit:'INR'|'percent'; period:Period;
 currency:'INR'; revision:number; estimated:boolean; statement:string;
};

// Confirmed sources ground both canonical tokens and ordinary labelled amounts.
// Proposals and CFO prose are never numerical authorities for a reply.
export function coachFinancialSources(map:MapMemory|null|undefined, facts:Fact[], revision:number):CoachFinancialSource[] {
 const sources:CoachFinancialSource[]=[];
 const add=(id:string,metric:string,label:string,state:FinancialValue,period:Period,unit:'INR'|'percent'='INR')=>{
  if(state.value===null || !Number.isFinite(state.value))return;
  const value=state.value,estimated=state.status==='ESTIMATED';
  const amount=new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(value);
  sources.push({id,metric,value,unit,period,currency:'INR',revision,estimated,
   statement:`${label}: ${unit==='INR'?`₹${amount} (INR)`:`${amount}%`}${estimated?' (estimate)':''}.`});
 };
 if(map){
  const status=financialStatus(map);
  for(const m of supportedMapMetrics(map))add(`map.${m.key}`,m.key,m.key==='surplus'?'Annual surplus after loan repayment, before investing':m.label,status.metrics[m.key as keyof typeof status.metrics],['assets','liabilities','networth'].includes(m.key)?'point_in_time':'annual');
  const inputs:[string,string,Period,'INR'|'percent'][]=[
   ['grossPersonalIncome','Gross personal income per year','annual','INR'],
   ['effectiveTaxRate','Effective personal tax rate for annual income','annual','percent'],
   ['monthlyNeeds','Household needs per month','monthly','INR'],
   ['monthlyWants','Household wants per month','monthly','INR'],
   ['annualInvesting','Investing per year','annual','INR'],
  ];
  for(const [key,label,period,unit] of inputs)add(`input.${key}`,key,label,status.inputs[key],period,unit);
  for(const [i,asset] of map.data.assets.entries()){
   add(`asset.${i}.value`,`assets.${asset.id}.value`,`Listed asset ${i+1} current value`,status.inputs[`assets.${asset.id}.value`],'point_in_time');
   add(`asset.${i}.income`,`assets.${asset.id}.annualNetIncome`,`Listed asset ${i+1} income per year`,status.inputs[`assets.${asset.id}.annualNetIncome`],'annual');
  }
  for(const [i,loan] of map.data.liabilities.entries()){
   add(`liability.${i}.value`,`liabilities.${loan.id}.value`,`Listed liability ${i+1} outstanding balance`,status.inputs[`liabilities.${loan.id}.value`],'point_in_time');
   add(`liability.${i}.repayment`,`liabilities.${loan.id}.annualRepayment`,`Listed liability ${i+1} repayment per year`,status.inputs[`liabilities.${loan.id}.annualRepayment`],'annual');
   add(`liability.${i}.rate`,`liabilities.${loan.id}.interestRate`,`Listed liability ${i+1} annual interest rate`,status.inputs[`liabilities.${loan.id}.interestRate`],'annual','percent');
  }
  for(const [key,label] of [['needs','Household needs per year'],['wants','Household wants per year'],['repayments','Loan repayments per year'],['deducted','Loan repayments per year not included in household needs'],['assetincome','Asset income per year'],['interest','Estimated loan interest per year']] as const)
   add(`map.${key}`,key,label,status.metrics[key],'annual');
  // Use existing guarded calculations, not model arithmetic or new formulas.
  const {values}=assessedMap(map);
  add('map.estimatedTax','estimatedTax','Estimated personal tax per year',values.estimatedTax,'annual');
  for(const [key,label] of [['investingRate','Annual investing as a share of take-home income'],['debtPercent','Outstanding liabilities as a share of assets'],['lifestyleCostShareOfTakeHome','Annual lifestyle costs as a share of take-home income']] as const)
   add(`ratio.${key}`,key,label,values[key],key==='debtPercent'?'point_in_time':'annual','percent');
 }
 const labels:Record<string,string>={income:'income',emi:'loan instalments',available_cash:'available cash',payments_due:'payments due',customer_receivables:'customer receivables',overdue_receivables:'overdue receivables'};
 for(const [i,f] of facts.entries()){
  // Duplicate identities are ambiguous even if their amounts happen to match.
  if(!labels[f.key] || !['exact','estimate'].includes(f.kind) || f.amount===null || f.currency!=='INR' || !f.asOf || facts.filter(x=>x.key===f.key&&x.scope===f.scope&&x.period===f.period).length!==1)continue;
  const period={monthly:'per month',annual:'per year',point_in_time:'balance'}[f.period];
  add(`fact.${i}`,`${f.scope}.${f.key}`,`${f.scope} ${labels[f.key]} (${period}, as of ${f.asOf})`,{value:f.amount,status:f.kind==='estimate'?'ESTIMATED':'CONFIRMED_AMOUNT',missing:[]},f.period);
 }
 for(const [i,c] of calculateInsights(facts.map(f=>({...f,confirmed:true}))).entries()){
  const labels:Record<string,string>={overdue_share:'Overdue receivables as a share of total receivables',emi_share:'Monthly loan instalments as a share of monthly income',cash_gap:'Payments due minus accessible cash'};
  if(!labels[c.key])continue;
  add(`insight.${i}`,c.key,`${c.scope} ${labels[c.key]} (as of ${c.asOf})`,{value:c.value,status:c.estimated?'ESTIMATED':'CONFIRMED_AMOUNT',missing:[]},c.key==='emi_share'?'monthly':'point_in_time',c.unit==='percent'?'percent':'INR');
 }
 return sources;
}

const datePattern=/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?\b/gi;
export function coachDates(texts:string[]):string[]{return texts.flatMap(text=>(text.match(datePattern)??[]).flatMap(date=>/\s\d{4}$/.test(date)?[date,date.replace(/\s\d{4}$/,'')]:[date]));}

// Literal amounts must match a named source, not any equal number in the MAP.
const metricNames:[RegExp,string][]=[
 // Qualifiers identify the balance, not the contribution named inside them.
 // Match the complete label so generic 'investing' cannot shadow 'surplus'.
 [/surplus (?:before|prior to) (?:your )?(?:annual )?invest(?:ing|ments?)/gi,'surplus'],
 [/after (?:your )?(?:annual )?invest(?:ing|ments?)\s*,?\s*(?:your |the )?(?:annual |yearly |monthly )?(?:surplus|cash(?: surplus)?|remaining cash)/gi,'afterinvesting'],
 [/cash after investing|after[- ]investing|after (?:your )?(?:annual )?invest(?:ing|ments?)|post[- ]investing|unallocated cash/gi,'afterinvesting'],
 [/surplus (?:after|following) (?:your )?(?:(?:loan|debt|annual|yearly) )?repayments?(?:\s*,?\s*(?:(?:and|but) )?(?:before|prior to) (?:your )?(?:annual )?invest(?:ing|ments?))?/gi,'surplus'],
 [/net\s*worth/gi,'networth'],
 [/take[- ]home(?: income)?|income after tax|after[- ]tax income|net income/gi,'takehome'],
 [/gross(?: personal)?(?: annual)? income|income before tax|annual income|income/gi,'grossPersonalIncome'],
 [/surplus|free cash flow|available cash flow/gi,'surplus'],
 [/lifestyle (?:costs?|spending)|household (?:costs?|spending)|(?:monthly|annual) spending|total spending|expenses/gi,'lifestyle'],
 [/needs/gi,'monthlyNeeds'],[/wants/gi,'monthlyWants'],
 [/loan repayments?|debt repayments?|yearly repayments?|annual repayments?/gi,'repayments'],
 [/total assets?|assets?/gi,'assets'],[/total liabilities|liabilities|outstanding (?:debt|loan)|debt balance/gi,'liabilities'],
 [/investing rate|investment rate|investing as a share/gi,'investingRate'],
 [/debt[- /]to[- ]assets?|debt percent/gi,'debtPercent'],
 [/annual interest(?: costs?)?|interest costs?/gi,'interest'],
 [/loan (?:annual )?interest(?: rate)?|interest rate/gi,'interestRate'],
 [/tax rate|effective (?:personal )?tax|tax percentage|tax/gi,'effectiveTaxRate'],
 [/annual investing|yearly investing|investing|investments?/gi,'annualInvesting'],
];
function metricIn(text:string):string|null{
 const candidates=metricNames.flatMap(([pattern,metric],priority)=>[...text.matchAll(pattern)].map(m=>({metric,start:m.index!,end:m.index!+m[0].length,priority})));
 // Prefer the last complete label, with specific labels taking precedence over
 // their generic substring ("income after tax" over "income", for example).
 const unshadowed=candidates.filter(c=>!candidates.some(other=>other!==c && other.start<=c.start && other.end>=c.end && other.priority<c.priority));
 return unshadowed.sort((a,b)=>b.end-a.end||a.priority-b.priority)[0]?.metric??null;
}
function sourceForMetric(metric:string,period:Period|undefined,sources:CoachFinancialSource[]){
 if(metric==='monthlyNeeds')metric=period==='annual'?'needs':'monthlyNeeds';
 if(metric==='monthlyWants')metric=period==='annual'?'wants':'monthlyWants';
 if(metric==='interestRate'){
  const rates=sources.filter(s=>s.metric.endsWith('.interestRate'));
  return rates.length===1?rates:[]; // Multiple loans need a specific source token.
 }
 return sources.filter(s=>s.metric===metric);
}
function literalNumbersGrounded(text:string,sources:CoachFinancialSource[],revision:number,dates:string[],diagnose?:(detail:CoachFigureRejection)=>void):boolean{
 const reject=(reason:string,numericString:string|null=null,metric:string|null=null,period:Period|null=null)=>{diagnose?.(rejectionDetail({numericString,metric,period,reason,revision},sources));return false;};
 const foreign=/([$€£¥]|\b(?:USD|EUR|GBP)\b)\s*([+−-]?\s*\d[\d,]*(?:\.\d+)?)/i.exec(text);
 if(/[$€£¥]|\b(?:USD|EUR|GBP)\b/i.test(text))return reject('unsupported_currency',foreign?.[0]??null,metricIn(text));
 if([...text].some(c=>/\p{N}/u.test(c)&&!/[0-9]/.test(c)))return reject('unsupported_numerals');
 const narrative=text.replace(datePattern,match=>dates.some(d=>d.toLowerCase()===match.toLowerCase())?' '.repeat(match.length):match)
  .replace(/\bunknown is not zero\b/gi,'Unknown stays unknown');
 // Counts are not financial quantities. Written-out money remains unsupported.
 const counts='actions?|steps?|goals?|options?|choices?|customers?|questions?|days?|weeks?|months?|years?|things?|commitments?';
 const prose=narrative.replace(new RegExp(`\\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?:useful |small |realistic |next |active |chosen )?(?:${counts})\\b`,'gi'),'chosen items')
  .replace(/\b(?:which|the|this|that) one\b|\bone of\b|\b(?:choose|pick) one\b/gi,'chosen item');
 if(/\b(?:lakh|crore|hundred|thousand|million|billion)\b/i.test(prose.replace(/\d[\d,.]*\s*(?:lakh|lac|crore|million|thousand|hundred|billion)s?\b/gi,'')))return reject('unparsed_written_amount');
 if(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/i.test(prose))return reject('unparsed_written_number');
 const numberPattern=/([+−-]?\s*(?:₹|\bRs\.?\s*|\bINR\s*))?\s*([+−-]?\s*\d[\d,]*(?:\.\d+)?)\s*(?:(lakh|lac|crore|million|thousand|k|l|cr)s?\b)?\s*(%|percent(?:age)?)?/gi;
 const numbers=[...prose.matchAll(numberPattern)];
 for(const [i,m] of numbers.entries()){
  const at=m.index!,end=at+m[0].length;
  const before=prose.slice(0,at),after=prose.slice(end);
  if(!m[1]&&!m[3]&&!m[4]){
   if(new RegExp(`^\\s*(?:${counts})\\b`,'i').test(after))continue;
   if(/\b(?:action|step|goal|option|choice)\s*$/i.test(before))continue;
   if(/(?:^|\n)\s*$/.test(before)&&/^\s*[.)]\s+\S/.test(after))continue;
  }
  const previousEnd=i?numbers[i-1].index!+numbers[i-1][0].length:0;
  const lastStop=Math.max(before.lastIndexOf(';'),before.lastIndexOf('!'),before.lastIndexOf('?'),before.lastIndexOf('\n'),before.search(/\.(?!\d)[^.]*$/));
  const prefix=prose.slice(Math.max(previousEnd,lastStop+1),at);
  const nextStart=numbers[i+1]?.index??prose.length;
  const suffix=prose.slice(end,nextStart).split(/[;!?\n]|\.(?!\d)/)[0];
  // A qualifier immediately after the amount belongs to this amount, never to
  // the next claim. This supports "surplus ... after repayment ... after investing".
  const qualifier=/^\s*(?:(?:per (?:month|year)|monthly|annually|yearly|a (?:month|year))\s*)?(?:after (?:your )?(?:annual )?invest(?:ing|ments?)|post[- ]investing)\b/i.test(suffix)?'afterinvesting':/^\s*(?:after tax|post[- ]tax)\b/i.test(suffix)&&! /\bgross\b/i.test(prefix)?'takehome':null;
  const immediateSuffix=suffix.split(/\band\b|\bbut\b|\bwhile\b|,/i)[0];
  const trailingMetric=/^\s*(?:(?:annual|monthly|yearly|gross|net)\s+)?(?:surplus|cash|net\s*worth|needs|wants|assets?|liabilities|income|spending|investing|investments?|tax|interest)\b/i.test(immediateSuffix)?metricIn(immediateSuffix):null;
  let metric=qualifier??trailingMetric??metricIn(prefix)??metricIn(immediateSuffix)??(i?metricIn(prose.slice(lastStop+1,at)):null);
  const numericString=m[0].trim();
  if(!metric)return reject('metric_not_identified',numericString);
  const periodText=trailingMetric?immediateSuffix:prefix+' '+immediateSuffix;
  const monthly=/\bmonthly\b|per month|a month/i.test(periodText),annual=/\bannual(?:ly)?\b|\byearly\b|per year|a year/i.test(periodText);
  if(monthly&&annual)return reject('conflicting_periods',numericString,metric);
  const period:Period|undefined=monthly?'monthly':annual?'annual':undefined;
  const unit=m[4]?'percent':'INR';
  if(metric==='effectiveTaxRate'&&unit==='INR')metric='estimatedTax';
  if(m[1]&&unit==='percent')return reject('currency_percentage_mismatch',numericString,metric,period??null);
  const multiplier=({lakh:100000,lac:100000,l:100000,crore:10000000,cr:10000000,million:1000000,thousand:1000,k:1000} as Record<string,number>)[m[3]?.toLowerCase()]??1;
  const leadingSign=m[1]?.trim().match(/^[+−-]/)?.[0];
  const numeric=m[2].replaceAll(',','').replace(/\s/g,'').replace('−','-');
  // The sign may appear before or after the currency symbol, never both.
  if(leadingSign&&/^[+-]/.test(numeric))return reject('duplicate_sign',numericString,metric,period??null);
  const value=Number(numeric)*multiplier*(leadingSign==='-'||leadingSign==='−'?-1:1);
  const approximate=/\b(?:about|around|approximately|roughly|estimated?|approx)\b|[~≈]/i.test(prefix);
  const precision=numeric.includes('.')?numeric.split('.')[1].length:0;
  const tolerance=unit==='percent'||approximate?multiplier*10**(-precision)/2+1e-8:.005;
  const candidates=sourceForMetric(metric,period,sources).filter(s=>s.revision===revision&&s.unit===unit&&s.currency==='INR');
  if(!candidates.some(s=>{
   if(s.estimated&&!approximate)return false;
   if(period&&s.period==='point_in_time')return false;
   // Normalise display periods only; MAP calculations are unchanged.
   const expected=period===s.period||!period?s.value:period==='monthly'&&s.period==='annual'?s.value/12:period==='annual'&&s.period==='monthly'?s.value*12:Number.NaN;
   if(unit==='percent'&&!approximate)return Number.isFinite(expected)&&Math.abs(value-Number(expected.toFixed(precision)))<1e-8;
   return Number.isFinite(expected)&&Math.abs(value-expected)<=tolerance;
  }))return reject(!candidates.length?'no_current_supported_metric':candidates.every(s=>s.estimated)&&!approximate?'estimate_label_missing':period&&candidates.every(s=>s.period==='point_in_time')?'period_not_applicable':'amount_mismatch',numericString,metric,period??null);
 }
 // Every currency/percentage token must actually belong to a parsed amount.
 const residual=prose.replace(numberPattern,'');
 return /[₹%]|\b(?:Rs\.?|INR)\s*(?:[+-]|$)/i.test(residual)?reject('unparsed_currency_or_percentage'):true;
}

export function renderCoachFinancialText(text:string,sources:CoachFinancialSource[],revision:number,dates:string[],diagnose?:(detail:CoachFigureRejection)=>void):string|null {
 const byId=new Map(sources.map(s=>[s.id,s]));
 const used=new Set<string>();
 const rendered:string[]=[];
 for(const line of text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){
  const token=/^\{\{financial:(\d+):([A-Za-z0-9.]+)\}\}$/.exec(line);
  if(token){
   const source=byId.get(token[2]);
   if(Number(token[1])!==revision || !source || source.revision!==revision || used.has(source.id) || used.size>=3){diagnose?.(rejectionDetail({numericString:null,metric:source?.id??null,period:source?.period??null,reason:Number(token[1])!==revision?'stale_source_revision':!source?'unknown_source':used.has(source.id)?'duplicate_source':'source_limit',revision},sources));return null;}
   used.add(source.id);rendered.push(source.statement);continue;
  }
  // No inline tokens: surrounding prose must not relabel a supported amount.
  if(/[{}]/.test(line) || /[,;]\s*$/.test(line) || (/:\s*$/.test(line)&&metricIn(line))){diagnose?.(rejectionDetail({numericString:null,metric:metricIn(line),period:null,reason:'invalid_financial_format',revision},sources));return null;}
  if(!literalNumbersGrounded(line,sources,revision,dates,diagnose))return null;
  rendered.push(line);
 }
 return rendered.length?rendered.join('\n\n'):null;
}

export const coachGroundingRules=`Use ONLY the supplied financial source catalog for numerical financial claims. map.surplus ALREADY includes loan repayments exactly once (either within needs or as separately deducted repayments); 'before investing' NEVER means before loan repayment. map.afterinvesting ALREADY deducts investing. Do not subtract repayment or investing again, invent counterfactual balances, or compute new amounts. For a direct question asking these saved surplus and after-investing figures, use their canonical financial tokens once each, with the current source revision. Both source statements already give the metric and annual period. You may write normal concise prose with rupees or lakh/crore formatting: explicitly name the metric (for example annual surplus after repayment versus annual cash after investing), its period, and any estimate status. Monthly/yearly display equivalents are allowed; never invent a new calculation. Rounded money needs "about" or "approximately". Percentages must match the named percentage metric. Nonfinancial counts, numbered action lists and explicit commitment dates are allowed. Alternatively write {{financial:REVISION:ID}} alone on a line using the exact source revision and id; the server renders that entire line. Never put prose on a token line, relabel it, duplicate a token or select more than three tokens. Unknown sources are absent, never zero. Proposals and CFO prose cannot authorize numbers: proposed facts are not confirmed yet, so acknowledge them qualitatively until saved. Keep helpful behavioural reflection and at most one useful question. Let the user choose commitments. Do not borrow an unrelated supported figure for another metric. Missing evidence requires clarification. These financial grounding rules override earlier formatting instructions without changing extraction, voluntary choices or saving rules.`;

// Pending inputs are not calculation authorities. Only raw values explicitly
// matched to the user's latest labelled, dated/period-qualified statement may
// explain a draft echo; callers replace that echo with a nonnumeric review prompt.
export function reportedCoachInputSources(map:MapMemory|null|undefined,facts:Fact[],answer:string,revision:number):CoachFinancialSource[] {
 const raw=coachFinancialSources(map,facts,revision).filter(s=>/^(input|asset|liability)\./.test(s.id));
 const aliases:Record<string,string>={income:'grossPersonalIncome',monthly_needs:'monthlyNeeds',monthly_wants:'monthlyWants',annual_investing:'annualInvesting',expenses:'lifestyle',assets:'assets',liabilities:'liabilities'};
 for(const [i,f] of facts.entries()){
  if(!aliases[f.key]||!['exact','estimate'].includes(f.kind)||f.amount===null||!Number.isFinite(f.amount)||f.currency!=='INR')continue;
  raw.push({id:`pending.fact.${i}`,metric:aliases[f.key],value:f.amount,period:f.period,unit:'INR',currency:'INR',revision,estimated:f.kind==='estimate',statement:''});
 }
 if(map?.data.assets.length===1){const s=raw.find(s=>s.id==='asset.0.value');if(s)raw.push({...s,id:'pending.assets',metric:'assets'});}
 if(map?.data.liabilities.length===1){const s=raw.find(s=>s.id==='liability.0.value');if(s)raw.push({...s,id:'pending.liabilities',metric:'liabilities'});}
 const clauses=answer.replace(/\/(?:mo(?:nth)?|mth)\b/gi,' per month').replace(/\/(?:yr|year)\b/gi,' per year').split(/[;!?\n]|\.(?!\d)|\band\b|,(?=\s*[A-Za-z])/i);
 return raw.filter(source=>clauses.some(clause=>{
  if(!/\d/.test(clause))return false;
  if(source.unit==='INR'&&source.period!=='point_in_time'&&!/\b(?:annual(?:ly)?|yearly|monthly|per (?:year|month)|a (?:year|month))\b/i.test(clause))return false;
  return literalNumbersGrounded(clause,[source],revision,coachDates([answer]));
 }));
}
