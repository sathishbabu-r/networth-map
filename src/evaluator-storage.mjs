// Evaluator credentials stay in this tab and never replace normal Google tokens.
export function evaluatorAuthStorage(pathname,storage,url){
 return /^\/try\/?$/.test(pathname)?{storage,storageNamespace:url+'-evaluator-v1'}:{};
}
