import {useEffect,useState} from 'react';
import {getFunctionName} from 'convex/server';
const listeners=new Set();
async function rawRequest(name,args={}){
 const response=await fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Local test request failed');return data;
}
let sessionReady;
async function request(name,args={}){sessionReady??=rawRequest("test:session");await sessionReady;return rawRequest(name,args);}
export function useQuery(ref,args){
 const name=getFunctionName(ref), key=JSON.stringify(args), [value,setValue]=useState(undefined);
 useEffect(()=>{let active=true;const refresh=()=>{if(args==='skip')return;request(name,args).then(v=>{if(active)setValue(v);}).catch(()=>{if(active)setValue(null);});};refresh();listeners.add(refresh);return()=>{active=false;listeners.delete(refresh);};},[name,key]);
 return args==='skip'?undefined:value;
}
const functions=new Map();
function call(ref){const name=getFunctionName(ref);if(!functions.has(name))functions.set(name,async args=>{const result=await request(name,args);for(const refresh of listeners)refresh();return result;});return functions.get(name);}
export const useAction=call;
export const useMutation=call;
const client={query:(ref,args)=>request(getFunctionName(ref),args)};
export function useConvex(){return client;}
export function useConvexAuth(){return {isAuthenticated:true,isLoading:false};}
