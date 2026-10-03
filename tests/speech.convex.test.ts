import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.{ts,js}');
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
test('speech action requires authentication and sends supported audio for text extraction without saving audio (mock OpenAI)',async()=>{
 const t=convexTest(schema,modules);const audio=new Uint8Array(200).buffer;
 const fetchMock=vi.fn(async(_url,request)=>{expect(_url).toBe('https://api.openai.com/v1/audio/transcriptions');expect(request.body.get('model')).toBe('whisper-1');expect(request.body.get('file').size).toBe(200);return new Response(JSON.stringify({text:' Around eight lakh. '}),{status:200,headers:{'Content-Type':'application/json'}});});vi.stubGlobal('fetch',fetchMock);vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');
 const denied=await t.action(api.speech.transcribe,{audio,mimeType:'audio/webm'});expect(denied.error).toMatch(/Sign in/);expect(fetchMock).not.toHaveBeenCalled();
 const userId=await t.run(ctx=>ctx.db.insert('users',{name:'Speech pilot'}));const authed=t.withIdentity({subject:userId+'|session'});
 expect(await authed.action(api.speech.transcribe,{audio,mimeType:'audio/webm'})).toEqual({text:'Around eight lakh.',error:null});expect(fetchMock).toHaveBeenCalledOnce();expect(await authed.query(api.huddles.current,{})).toBeNull();
});
test('speech failure is recoverable and empty audio never reaches the provider (mock OpenAI)',async()=>{const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{name:'Speech pilot'}));const a=t.withIdentity({subject:id+'|session'});vi.stubEnv('OPENAI_API_KEY','test-only-placeholder');const fetchMock=vi.fn(async()=>new Response('',{status:429}));vi.stubGlobal('fetch',fetchMock);const empty=await a.action(api.speech.transcribe,{audio:new ArrayBuffer(20),mimeType:'audio/webm'});expect(empty.error).toMatch(/empty or too large/);expect(fetchMock).not.toHaveBeenCalled();const busy=await a.action(api.speech.transcribe,{audio:new ArrayBuffer(200),mimeType:'audio/webm'});expect(busy.error).toMatch(/billing limit/);expect(busy.text).toBe('');});
