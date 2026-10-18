// Actual local UI regression. Never opens production or consumes admissions.
// Run: node tests/browser/mobile-form-visibility.cjs
const {chromium}=require(process.env.PLAYWRIGHT_PATH || '/Users/admin/build-sprint-qa-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('docs/validation/mobile-obstruction');fs.mkdirSync(out,{recursive:true});
const sizes=[{width:320,height:568},{width:360,height:740},{width:390,height:844}];
const cases=[...sizes.map(size=>({...size,notice:false})),...sizes.map(size=>({...size,notice:true})),{width:390,height:844,notice:true,safeArea:true}];
async function seed(page){
 await page.evaluate(async()=>{
  const {emptyMap}=await import('/shared/map-engine.ts');const map=emptyMap();map.step=1;map.covered=['earn','own','owe','spend','invest','blueprint','lifestyle','goals','milestone','reflect'];
  Object.assign(map.data,{userType:'business-owner',grossPersonalIncome:'2400000',effectiveTaxRate:'20',monthlyNeeds:'60000',monthlyWants:'30000',annualInvesting:'240000',hasNoLiabilitiesConfirmed:false,visionLevel:'independence',visionChoiceConfirmed:true,wealthGoals:['dreams'],wealthGoalDetails:[{category:'dreams',description:'Synthetic reserve',amount:'600000',targetYear:'2030',priority:'important',flexibility:'date'}],wealthMilestoneChoice:'not-yet',moneyPurpose:'Financial clarity',wealthMotivation:'Synthetic household security',assets:[{id:'cash',description:'Savings',category:'cash',value:'5000000',purpose:'investment',annualNetIncome:'0'}],liabilities:[{id:'loan',description:'Synthetic loan',type:'personal',classification:'personal',value:'1000000',interestRate:'10',annualRepayment:'300000',repaymentIncludedInNeeds:false}]});
  const r=await fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'huddles:save',args:{content:{concern:'Synthetic mobile visibility regression',map,facts:[],goal:null,action:null,outcome:null},expectedRevision:0}})});if(!r.ok)throw Error(await r.text());
 });
 await page.reload();await page.getByRole('button',{name:'Continue My MAP',exact:true}).click();
}
async function keyboard(page,height,offsetTop=0){
 await page.evaluate(({height,offsetTop})=>{
  window.__keyboard=height?{height,offsetTop}:null;
  window.visualViewport.dispatchEvent(new Event('resize'));window.visualViewport.dispatchEvent(new Event('scroll'));
 },{height,offsetTop});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
// Wait for the actual visible geometry after native resize callbacks finish.
// The same strict bounds and hit tests are asserted again below.
async function waitVisible(page, control, edges) {
 await page.waitForFunction(({el,edges})=>{
  if(!el?.isConnected)return false;
  const r=el.getBoundingClientRect(),sc=el.closest('.original-map-scroll')?.getBoundingClientRect(),v=window.visualViewport;
  if(!sc||!r.width||!r.height)return false;
  if(r.top<Math.max(sc.top,v.offsetTop)-1||r.bottom>Math.min(sc.bottom,v.offsetTop+v.height)+1)return false;
  const xs=edges?[r.left+Math.min(4,r.width/2),r.right-Math.min(4,r.width/2)]:[r.left+r.width/2];
  const visible=xs.every(x=>{const hit=document.elementFromPoint(x,r.top+r.height/2);return hit===el||el.contains(hit)});
  const geometry=JSON.stringify([r.top,r.bottom,sc.top,sc.bottom,v.offsetTop,v.height]);
  const previous=el.__visibilitySample;
  if(!visible||previous?.geometry!==geometry){el.__visibilitySample={geometry,since:performance.now()};return false;}
  return performance.now()-previous.since>=150;
 },{el:await control.elementHandle(),edges},{timeout:1000});
}
async function check(page,step,state){
 await page.evaluate(()=>document.activeElement?.blur());
 const scroller=page.locator('.original-map-scroll');
 // Sample the whole screen, including bottom content, rather than assume a selector means visibility.
 const samples=await page.evaluate(()=>{
  const sc=document.querySelector('.original-map-scroll'),max=sc.scrollHeight-sc.clientHeight;return [0,max/2,max];
 });
 for(const scrollTop of samples){
  await scroller.evaluate((el,top)=>el.scrollTop=top,scrollTop);
  const collision=await page.evaluate(()=>{
   const launch=document.querySelector('.huddle-launcher').getBoundingClientRect();
   const scroll=document.querySelector('.original-map-scroll').getBoundingClientRect();
   const controls=[...document.querySelectorAll('.original-map-scroll input,.original-map-scroll textarea,.original-map-scroll select,.original-map-scroll [role=alert],.original-map-scroll .field-error,.wizard-actions button')];
   for(const el of controls){const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
    if(Math.min(r.right,launch.right)>Math.max(r.left,launch.left)&&Math.min(r.bottom,launch.bottom,scroll.bottom)>Math.max(r.top,launch.top,scroll.top))return {label:el.getAttribute('aria-label')||el.textContent||el.tagName,rect:{top:r.top,bottom:r.bottom},launcher:{top:launch.top,bottom:launch.bottom}};
   }
   return null;
  });assert.equal(collision,null,`${step}/${state}: launcher overlaps ${JSON.stringify(collision)}`);
 }
 const view=step<=10?page.locator('.wizard'):page.locator('.journey-section');
 const editable=view.locator('input:not([type=range]):not([type=checkbox]):not([type=hidden]),textarea,select').filter({visible:true});
 if(await editable.count()){
  const field=editable.last();await field.focus();await waitVisible(page,field,true);
  const hit=await field.evaluate(el=>{const r=el.getBoundingClientRect(),sc=el.closest('.original-map-scroll').getBoundingClientRect(),v=window.visualViewport;
   const points=[r.left+Math.min(4,r.width/2),r.right-Math.min(4,r.width/2)].map(x=>{const hit=document.elementFromPoint(x,r.top+r.height/2);return hit===el||el.contains(hit)});
   return {top:r.top,bottom:r.bottom,visibleTop:Math.max(sc.top,v.offsetTop),visibleBottom:Math.min(sc.bottom,v.offsetTop+v.height),points};
  });assert.ok(hit.top>=hit.visibleTop-1&&hit.bottom<=hit.visibleBottom+1&&hit.points.every(Boolean),`${step}/${state}: focused control covered or clipped ${JSON.stringify(hit)}`);
 }
 const navigation=step<=10?page.locator('.wizard-actions button').last():view.getByRole('button').first();
 if(await navigation.count()){
  await navigation.scrollIntoViewIfNeeded();
  await navigation.focus();await waitVisible(page,navigation,false);
  const hit=await navigation.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),sc=el.closest('.original-map-scroll').getBoundingClientRect(),v=window.visualViewport;return {usable:hit===el||el.contains(hit),top:r.top,bottom:r.bottom,min:Math.max(sc.top,v.offsetTop),max:Math.min(sc.bottom,v.offsetTop+v.height)};});
  assert.ok(hit.usable&&hit.top>=hit.min-1&&hit.bottom<=hit.max+1,`${step}/${state}: navigation covered ${JSON.stringify(hit)}`);
 }
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${step}/${state}: horizontal overflow`);
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[],errors=[];let externalRequests=0;
 try{
 for(const size of cases){
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true});
  // Controlled keyboard simulation: visual viewport shrinks while layout height stays unchanged.
  await context.addInitScript(()=>{
   const native=window.visualViewport,v=new EventTarget();window.__keyboard=null;
   Object.defineProperties(v,{height:{get:()=>window.__keyboard?.height??native?.height??innerHeight},offsetTop:{get:()=>window.__keyboard?.offsetTop??native?.offsetTop??0},width:{get:()=>native?.width??innerWidth}});
   native?.addEventListener('resize',()=>v.dispatchEvent(new Event('resize')));native?.addEventListener('scroll',()=>v.dispatchEvent(new Event('scroll')));
   Object.defineProperty(window,'visualViewport',{configurable:true,value:v});
  });
  await context.tracing.start({screenshots:true,snapshots:true});const page=await context.newPage();page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();externalRequests++;return r.abort();});
  if(size.notice)await page.route('**/__local_test',r=>r.request().postDataJSON()?.name==='evaluator:session'?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,kind:'evaluator',expiresAt:Date.now()+14400000})}):r.continue());
  const label=`${size.width}-${size.notice?'evaluator-notice':'account'}${size.safeArea?'-safe-area':''}`;
  try{
   await page.goto('http://127.0.0.1:5180');await page.getByText('LOCAL TEST MODE',{exact:false}).waitFor();await seed(page);
   if(size.safeArea){
    // Resolve the exact CSS env() expressions to nonzero inset fixtures; no device-notch claim.
    const styles=['src/style.css','src/original-map/original.css'].map(file=>fs.readFileSync(file,'utf8')).join('\n').replaceAll('env(safe-area-inset-bottom)','34px').replaceAll('env(safe-area-inset-top)','24px').replaceAll('env(safe-area-inset-right)','20px');
    await page.addStyleTag({content:styles});
    assert.equal(await page.locator('.huddle-launcher').evaluate(el=>getComputedStyle(el).marginBottom),'58px');
   }
   for(let step=1;step<=12;step++){
    await page.setViewportSize({width:size.width,height:size.height});await keyboard(page,null);await page.waitForTimeout(650);const confirm=page.getByRole('button',{name:'Confirm financial snapshot',exact:true});if(await confirm.isVisible()){await confirm.click();await page.getByText('Remembered privately',{exact:true}).waitFor();}await page.getByRole('button',{name:new RegExp(`^Step ${step}:`)}).click();
    if(step===1)await page.getByRole('heading',{name:'What is your income before tax?'}).waitFor();
    const row={width:size.width,context:label,step,normal:'UNKNOWN',keyboard:'UNKNOWN',pannedKeyboard:'UNKNOWN',layoutKeyboard:'UNKNOWN'};results.push(row);
    for(const [state,height,offset] of [['normal',null,0],['keyboard',Math.min(360,size.height-220),0],['pannedKeyboard',Math.min(360,size.height-220),100],['layoutKeyboard',null,0]]){
     if(state==='layoutKeyboard')await page.setViewportSize({width:size.width,height:360});
     await keyboard(page,height,offset);try{await check(page,step,state);row[state]='PASS';}catch(e){row[state]='FAIL: '+e.message;}
    }
    await page.screenshot({path:path.join(out,`${label}-step-${step}.png`)});
   }
   await page.setViewportSize({width:size.width,height:size.height});
   await keyboard(page,null);await page.getByRole('button',{name:/^Step 4:/}).click();
   const wants=page.getByRole('textbox',{name:/Monthly Wants/});await wants.fill('-1');await keyboard(page,340);
   const alert=page.locator('.field-error').filter({visible:true}).first();await alert.scrollIntoViewIfNeeded();assert.ok(await alert.isVisible());await check(page,4,'invalid amount');await page.screenshot({path:path.join(out,`${label}-error.png`)});
   await wants.fill('30000');await keyboard(page,null);await page.locator('.wizard-actions .primary').click();await page.getByRole('heading',{name:'How much do you invest each year?'}).waitFor();
   await page.getByRole('button',{name:/^Step 10:/}).click();await page.getByRole('button',{name:/Generate My MAP/}).click();await page.getByRole('button',{name:'Print or Save MAP'}).waitFor();
   assert.ok((await page.locator('body').innerText()).includes('₹40,00,000'));
   await page.waitForTimeout(650);const confirm=page.getByRole('button',{name:'Confirm financial snapshot',exact:true});if(await confirm.isVisible()){await confirm.click();await page.getByText('Remembered privately',{exact:true}).waitFor();}
   await page.getByRole('button',{name:'Ask Your Money Coach',exact:true}).click();await keyboard(page,360,50);
   const composer=page.getByRole('textbox',{name:'Review your words, or type instead'});await composer.fill('Explain my saved financial picture.');
   const coach=await page.locator('#money-huddle-panel').evaluate(el=>{const r=el.getBoundingClientRect(),v=window.visualViewport;return {top:r.top,bottom:r.bottom,min:v.offsetTop,max:v.offsetTop+v.height};});
   assert.ok(coach.top>=coach.min&&coach.bottom<=coach.max,`Coach outside visible keyboard viewport ${JSON.stringify(coach)}`);
   await page.getByRole('button',{name:'Send message',exact:true}).click();await page.locator('#messages .message.assistant').nth(1).waitFor();
   await page.screenshot({path:path.join(out,`${label}-coach-keyboard.png`)});
   await page.getByRole('button',{name:'Minimise Money Huddle',exact:true}).click();await keyboard(page,null);
   await page.reload();await page.getByRole('button',{name:'Continue My MAP',exact:true}).click();await page.getByRole('button',{name:/^Step 4:/}).click();assert.equal((await wants.inputValue()).replaceAll(',',''),'30000');
  }catch(e){results.push({width:size.width,context:label,extraChecks:'FAIL: '+e.stack});}
  finally{await context.tracing.stop({path:path.join(out,`${label}-trace.zip`)});await page.evaluate(()=>fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'test:reset',args:{}})})).catch(()=>{});await context.close();}
 }
 const failures=results.filter(r=>Object.values(r).some(v=>typeof v==='string'&&v.startsWith('FAIL')));const summary={status:!failures.length&&!errors.length&&!externalRequests?'PASS':'FAIL',viewports:sizes,contexts:cases,stepsChecked:results.filter(r=>r.step).length,keyboardSimulation:'VisualViewport height/offset events; no physical phone keyboard',safeAreaSimulation:'Exact CSS env() expressions resolved to 24px top/34px bottom/20px right fixtures',externalRequests,pageErrors:errors,results};
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({status:summary.status,steps:summary.stepsChecked,failures,errors,externalRequests},null,2));if(summary.status!=='PASS')process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
