const actions={signIn:async()=>{},signOut:async()=>{await fetch('/__local_test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'test:reset',args:{}})});location.replace('/');}};
export function useAuthActions(){return actions;}
