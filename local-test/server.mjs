import {randomBytes} from 'node:crypto';
export function localTestServer(){
 const token=randomBytes(32).toString('hex');
 return {name:'isolated-local-test',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
   if(req.url?.split('?')[0]!=='/__local_test')return next();
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
   try{
    if(req.method!=='POST'||req.headers.host!=='127.0.0.1:5180'||req.headers.origin!=='http://127.0.0.1:5180'||!req.headers['content-type']?.startsWith('application/json'))throw Error('Local same-origin requests only.');
    let body='';for await(const chunk of req){body+=chunk;if(body.length>150000)throw Error('Request too large');}
    const cookie=req.headers.cookie?.match(/(?:^|; )map_test=([a-f0-9]{64})(?:;|$)/)?.[1];
    const id=cookie||randomBytes(32).toString('hex');
    if(!cookie)res.setHeader('Set-Cookie',`map_test=${id}; HttpOnly; SameSite=Strict; Path=/`);
    const runtime=await server.ssrLoadModule('/local-test/runtime.ts');
    const input=JSON.parse(body);const value=await runtime.dispatch(token,id,input.name,input.args);
    if(input.name==='test:reset')res.setHeader('Set-Cookie','map_test=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.end(JSON.stringify(value));
   }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message}));}
  });
 }};
}
