// Offline only: consumes genuine saved CFO JSON outputs; makes no AI calls.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomInt} from 'node:crypto';
const [systemPath,baselinePath,out]=process.argv.slice(2);
if(!systemPath||!baselinePath||!out)throw Error('Usage: node scripts/blind-validation.mjs system-cfo.json baseline-cfo.json output-folder');
const system=JSON.parse(readFileSync(systemPath,'utf8')),baseline=JSON.parse(readFileSync(baselinePath,'utf8'));
const fields=['story','insights','strategic_gap','tradeoffs','attention_now','no_action','behaviour','coach_questions','confidence','caveats'];
const normalise=x=>Object.fromEntries(fields.map(k=>[k,k==='insights'?(x[k]??[]).map(i=>i.text):x[k]]));
const swap=randomInt(2)===1;
mkdirSync(out,{recursive:true});
writeFileSync(out+'/outputs.json',JSON.stringify({A:normalise(swap?system:baseline),B:normalise(swap?baseline:system)},null,2),{flag:'wx'});
writeFileSync(out+'/answer-key.json',JSON.stringify(swap?{A:'system',B:'baseline'}:{A:'baseline',B:'system'}),{flag:'wx'});
const dimensions=['Financial correctness','Non-obvious insight','Personalisation','Strategic reasoning','Trade-off awareness','Behavioural insight','Actionability','Clarity','Trust','Overall usefulness'];
writeFileSync(out+'/ratings.csv','dimension,A (1-10),B (1-10),comments\n'+dimensions.map(d=>d+',,,').join('\n')+'\nPreferred assistant (A/B/tie),,,\nReason for preference,,,\n',{flag:'wx'});
