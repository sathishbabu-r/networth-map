import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {testModeEnabled} from '../local-test/guard.mjs';
import {loadEntry,isDemoPath} from '../src/route-entry.mjs';
test('test access requires explicit local development enablement',()=>{
 assert.equal(testModeEnabled('serve','development',{}),false);
 assert.equal(testModeEnabled('serve','development',{APP_TEST_MODE:'1'}),true);
 for(const [command,mode,env] of [['build','production',{APP_TEST_MODE:'1'}],['build','development',{APP_TEST_MODE:'1'}],['serve','production',{APP_TEST_MODE:'1'}],['serve','development',{APP_TEST_MODE:'1',NODE_ENV:'production'}],['build','production',{VITE_APP_TEST_MODE:'1'}]])assert.throws(()=>testModeEnabled(command,mode,env),/local development only/);
});
test('demo paths use the normal application and scripted demo files are removed',async()=>{
 for(const path of ['/demo','/demo/','/demo/private']){assert.equal(isDemoPath(path),true);assert.equal(await loadEntry(path,{production:async()=> 'normal'}),'normal');}
 for(const file of ['DemoApp.jsx','demo-data.js','demo-entry.jsx','demo.css'])assert.equal(existsSync('src/'+file),false);
});
test('local server rejects other hosts and origins and has no production client',()=>{
 const server=readFileSync('local-test/server.mjs','utf8'),runtime=readFileSync('local-test/runtime.ts','utf8');
 assert.match(server,/req.headers.origin/);assert.match(server,/HttpOnly; SameSite=Strict/);
 assert.doesNotMatch(runtime,/ConvexHttpClient|ConvexReactClient|VITE_CONVEX_URL|OPENAI_API_KEY/);
});

test('evaluator storage uses a separate tab namespace and leaves normal Google storage unchanged',async()=>{
 const {evaluatorAuthStorage}=await import('../src/evaluator-storage.mjs');const storage={};
 assert.deepEqual(evaluatorAuthStorage('/',storage,'https://production.convex.cloud'),{});
 assert.deepEqual(evaluatorAuthStorage('/try',storage,'https://production.convex.cloud'),{storage,storageNamespace:'https://production.convex.cloud-evaluator-v1'});
});

test('deployment preflight refuses local test mode before any hosting command can run',async()=>{
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['local-test/check-release.mjs'],{cwd:process.cwd(),env:{...process.env,APP_TEST_MODE:'1'},encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/local development only/);
});
