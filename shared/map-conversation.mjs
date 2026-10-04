// Conversation guidance only: no calculations or new stored fields.
export function mapConversation(map) {
  const d = map?.data ?? {};
  const covered = map?.covered ?? [], unknowns = map?.unknowns ?? [];
  const missing = [];
  const add = (path, question) => { if (!d[path] && !unknowns.includes(path)) missing.push({path, question}); };
  add('userType', 'How do you mainly earn your income?');
  add('grossPersonalIncome', 'Roughly how much personal income do you receive each year, before tax?');
  add('effectiveTaxRate', 'Roughly what percentage of your personal income goes to tax?');
  if (!covered.includes('own') && !unknowns.includes('own')) missing.push({path:'own', question:'What assets do you currently own?'});
  if (!covered.includes('owe') && !d.hasNoLiabilitiesConfirmed && !unknowns.includes('owe')) missing.push({path:'owe', question:'What loans or debts are you personally responsible for?'});
  add('monthlyNeeds', 'Roughly how much do your essential household costs total each month?');
  add('monthlyWants', 'Roughly how much do you spend on lifestyle choices each month?');
  add('annualInvesting', 'Roughly how much do you invest each year?');
  if (!d.visionChoiceConfirmed && !unknowns.includes('visionLevel')) missing.push({path:'visionLevel', question:'What would financial security, independence or freedom mean for you?'});
  if (!covered.includes('goals') && !unknowns.includes('goals')) missing.push({path:'goals', question:'What life goal matters most to you?'});
  add('wealthMilestoneChoice', 'Would you like to set a wealth milestone, or leave that for later?');
  if (d.wealthMilestoneChoice === 'yes') {
    add('targetNetworth', 'What net worth would you like to work towards?');
    add('currentAge', 'How old are you currently?');
    if (!(d.targetTiming === 'year' ? d.targetYear : d.targetAge)) missing.push({path:'targetTiming', question:'By what age or year would you like to reach that milestone?'});
  }
  return {role: missing.length ? 'build_map' : 'guide_next_move', missing};
}

export function financialChanges(proposal, confirmed) {
  const changes = [];
  const oldFacts = new Map((confirmed?.facts ?? []).map(f => [f.key, f]));
  for (const f of proposal.facts ?? []) {
    const old = oldFacts.get(f.key);
    const same = old && ['kind','amount','lower','upper','scope','period','currency','asOf'].every(k => old[k] === f[k]);
    if (!same && f.kind !== 'unknown') changes.push({label:f.label, value:f.kind === 'range' ? `₹${f.lower}–₹${f.upper}` : `₹${Number(f.amount).toLocaleString('en-IN')}`, detail:`${f.kind} · ${f.period} · ${f.scope}`});
  }
  const map = proposal.map, oldMap = confirmed?.map;
  if (!map) return changes;
  const labels = {grossPersonalIncome:'Annual personal income before tax',effectiveTaxRate:'Effective personal tax rate',monthlyNeeds:'Monthly household needs',monthlyWants:'Monthly lifestyle spending',annualInvesting:'Annual investing',desiredLifestyleMonthly:'Desired monthly lifestyle',currentAge:'Current age',targetAge:'Target age',targetYear:'Target year',targetNetworth:'Target net worth'};
  const add = (path, label, value, previous, unit='money') => {
    if (value === '' || value == null || map.unknowns.includes(path)) return;
    if (value === previous && map.estimates.includes(path) === Boolean(oldMap?.estimates.includes(path))) return;
    changes.push({label, value:unit === 'money' ? `₹${Number(value).toLocaleString('en-IN')}` : `${value}${unit==='percent'?'%':''}`, detail:map.estimates.includes(path)?'Estimate':'As supplied'});
  };
  for (const [path,label] of Object.entries(labels)) add(path,label,map.data[path],oldMap?.data[path],path==='effectiveTaxRate'?'percent':['currentAge','targetAge','targetYear'].includes(path)?'plain':'money');
  for (const collection of ['assets','liabilities','lifestyleChanges','wealthGoalDetails']) {
    for (const row of map.data[collection] ?? []) {
      const key = row.id ?? row.category, old = oldMap?.data[collection]?.find(r => (r.id ?? r.category) === key);
      for (const field of ['value','annualNetIncome','interestRate','annualRepayment','monthlyAmount','amount']) {
        if (field in row) add(`${collection}.${key}.${field}`, `${row.description || row.category} · ${field.replace(/([A-Z])/g,' $1').toLowerCase()}`, row[field], old?.[field],field==='interestRate'?'percent':'money');
      }
    }
  }
  return changes;
}
