import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/voice.js', import.meta.url), 'utf8');
let index = 0;
async function setup({ configured = true, results = [{text:'two lakh a month',error:null}] } = {}) {
  const elements = new Map();
  const element = name => { if (!elements.has(name)) elements.set(name, {textContent:'',disabled:false,hidden:false,value:'',checked:false,focus(){},classList:{toggle(){}},querySelector: key => element(name+key)}); return elements.get(name); };
  const container = {set innerHTML(value){},querySelector: element,querySelectorAll: () => [element('.retry'),element('.discard')]};
  let trackStopped = 0, microphoneCalls = 0, requests = 0;
  class Recorder {
    static isTypeSupported(){ return true; }
    constructor(stream, options){this.mimeType=options.mimeType;this.state='inactive';}
    start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob(['x'.repeat(200)])});this.onstop();}
  }
  globalThis.window = {MediaRecorder:Recorder,addEventListener(){}};
  globalThis.MediaRecorder = Recorder;
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{async getUserMedia(){microphoneCalls++;return {getTracks:()=>[{stop(){trackStopped++;}}]};}}}});
  const { attachVoice } = await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+index++).toString('base64'));
  const input = element('answer');input.value='Existing answer.';
  const send = element('send');
  attachVoice(container,input,send,{ready:async()=>configured,transcribe:async args=>{requests++;assert.equal(args.mimeType,'audio/webm');assert.equal(args.audio.byteLength,200);return results.shift();}});
  element('input').checked=true;
  return {element,input,send,counts:()=>({trackStopped,microphoneCalls,requests})};
}
const settle = () => new Promise(resolve=>setImmediate(resolve));
test('missing key prevents microphone capture and preserves typed answer', async()=>{
  const s=await setup({configured:false}); await s.element('.microphone').onclick();
  assert.equal(s.counts().microphoneCalls,0);assert.equal(s.input.value,'Existing answer.');assert.equal(s.send.disabled,false);
});
test('recording becomes editable text without sending to coach and releases microphone',async()=>{
  const s=await setup();await s.element('.microphone').onclick();assert.equal(s.send.disabled,true);
  await s.element('.microphone').onclick();await settle();
  assert.equal(s.input.value,'Existing answer. two lakh a month');assert.equal(s.send.disabled,false);assert.equal(s.counts().trackStopped,1);
});
test('failed transcription preserves original answer and retries same recording',async()=>{
  const s=await setup({results:[{text:'',error:'Temporary failure'},{text:'corrected words',error:null}]});
  await s.element('.microphone').onclick();await s.element('.microphone').onclick();await settle();
  assert.equal(s.input.value,'Existing answer.');assert.equal(s.element('.recording-recovery').hidden,false);
  s.element('.retry').onclick();await settle();assert.equal(s.input.value,'Existing answer. corrected words');assert.equal(s.counts().requests,2);
});
