// Local browser regression: the Money Huddle launcher must never cover MAP navigation.
// Run against npm run dev:test on port 5180. No production requests or admissions.
const {chromium}=require('/Users/admin/build-sprint-qa-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('docs/validation/desktop-launcher');fs.mkdirSync(out,{recursive:true});
async function seed(page){
 await page.evaluate(async()=>{
  const {emptyMap}=await import('/shared/map-engine.ts');const map=emptyMap();map.step=1;map.covered=['earn','own','owe','spend','invest','blueprint','lifestyle','goals','milestone','reflect'];
  Object.assign(map.data,{userType:'business-owner',grossPersonalIncome:'2400000',effectiveTaxRate:'20',monthlyNeeds:'60000',monthlyWants:'30000',annualInvesting:'240000',hasNoLiabilitiesConfirmed:false,visionLevel:'independence',visionChoiceConfirmed:true,wealthGoals:['dreams'],wealthGoalDetails:[{category:'dreams',description:'Synthetic reserve',amount:'600000',targetYear:'2030',priority:'important',flexibility:'date'}],wealthMilestoneChoice:'not-yet',moneyPurpose:'Financial clarity',wealthMotivation:'Synthetic household security',assets:[{id:'cash',description:'Savings',category:'cash',value:'5000000',purpose:'investment',annualNetIncome:'0'}],liabilities:[{id:'loan',description:'Synthetic loan',type:'personal',classification:'personal',value:'1000000',interestRate:'10',annualRepayment:'300000',repaymentIncludedInNeeds:false}]});
  const r=await fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'huddles:save',args:{content:{concern:'Synthetic mobile visibility regression',map,facts:[],goal:null,action:null,outcome:null},expectedRevision:0}})});if(!r.ok)throw Error(await r.text());
 });
 await page.reload();await page.getByRole('button',{name:'Continue My MAP',exact:true}).click();
}

(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];let externalRequests=0;const pageErrors=[];
 const before=process.argv.includes('--expect-overlap');
 try{for(const size of before?[{width:1280,height:720}]:[{width:390,height:844},{width:768,height:720},{width:1024,height:720},{width:1280,height:720},{width:1440,height:900}]){
  const context=await browser.newContext({viewport:size});const page=await context.newPage();
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();externalRequests++;return r.abort();});
  await page.goto('http://127.0.0.1:5180');await page.getByText('LOCAL TEST MODE',{exact:false}).waitFor();await seed(page);
  for(const step of before?[6]:Array.from({length:12},(_,i)=>i+1)){
   await page.waitForTimeout(650);const confirm=pending=>pending.getByRole('button',{name:'Confirm financial snapshot',exact:true});if(await confirm(page).isVisible()){await confirm(page).click();await page.getByText('Remembered privately',{exact:true}).waitFor();}
   await page.getByRole('button',{name:new RegExp(`^Step ${step}:`)}).click();
   const sc=page.locator('.original-map-scroll');await sc.evaluate(el=>el.scrollTop=el.scrollHeight);
   if(!before)await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   const metrics=await page.evaluate(()=>{
    const sc=document.querySelector('.original-map-scroll'),launch=document.querySelector('.huddle-launcher'),a=launch.getBoundingClientRect(),b=sc.getBoundingClientRect();
    const nav=sc.querySelector('.wizard-actions button:last-child');const n=nav?.getBoundingClientRect();
    const intersects=r=>r&&Math.min(r.right,a.right)>Math.max(r.left,a.left)&&Math.min(r.bottom,a.bottom)>Math.max(r.top,a.top);
    return {launcher:{top:a.top,bottom:a.bottom,left:a.left,right:a.right},scroller:{top:b.top,bottom:b.bottom},nav:n?{top:n.top,bottom:n.bottom,left:n.left,right:n.right,text:nav.textContent.trim()}:null,viewportHeight:innerHeight,bottomGap:innerHeight-a.bottom,navCovered:!!intersects(n),scrollerCovered:!!intersects(b),launcherPosition:getComputedStyle(launch).position,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   results.push({...size,step,...metrics});
   if(step===6)await page.screenshot({path:path.join(out,`${size.width}-${before?'before':'after'}-blueprint-bottom.png`)});
   if(before)assert.ok(metrics.navCovered,'Could not reproduce reported 1280px obstruction');
   else {assert.equal(metrics.navCovered,false,JSON.stringify(results.at(-1)));assert.equal(metrics.scrollerCovered,false,JSON.stringify(results.at(-1)));assert.equal(metrics.overflow,false);assert.ok(metrics.bottomGap>=31,'Raised launcher must retain at least 32px bottom clearance');assert.ok(metrics.launcher.top>=0&&metrics.launcher.bottom<=metrics.viewportHeight+1,'Launcher is outside the visible screen');}
  }
  if(!before){
   await page.getByRole('button',{name:/^Step 6:/}).click();await page.getByRole('button',{name:/Define My Vision/}).click();await page.getByRole('heading',{name:'What should your wealth make possible every month?'}).first().waitFor();
   assert.equal(await page.getByRole('button',{name:'Ask Your Money Coach'}).getAttribute('aria-expanded'),'false');
   await page.getByRole('button',{name:'Ask Your Money Coach'}).click();assert.equal(await page.locator('#money-huddle-panel').isVisible(),true);
   await page.getByRole('button',{name:/minimi|close money/i}).click();assert.equal(await page.getByRole('button',{name:'Ask Your Money Coach'}).isVisible(),true);
   await page.waitForTimeout(650);const confirm=page.getByRole('button',{name:'Confirm financial snapshot',exact:true});if(await confirm.isVisible())await confirm.click();
   await page.getByText('Remembered privately',{exact:true}).waitFor();
   await page.reload();await page.getByRole('button',{name:'Continue My MAP',exact:true}).click();
   await page.getByRole('heading',{name:'What should your wealth make possible every month?'}).waitFor();
  }
  await page.evaluate(()=>fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'test:reset',args:{}})}));await context.close();
 }
 assert.equal(externalRequests,0);assert.deepEqual(pageErrors,[]);
 fs.writeFileSync(path.join(out,before?'before.json':'browser-results.json'),JSON.stringify({status:'PASS',externalRequests,pageErrors,results},null,2));console.log(JSON.stringify({status:'PASS',screens:results.length,externalRequests,pageErrors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
