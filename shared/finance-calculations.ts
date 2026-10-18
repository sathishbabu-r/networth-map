// Pure finance helpers. Unknown is null; zero remains a real value.
export function ratio(n:number|null,d:number|null):number|null{return n===null||d===null||!Number.isFinite(n)||!Number.isFinite(d)||d<=0?null:n/d;}
export function goalGap(target:number|null,available:number|null):number|null{return target===null||available===null?null:Math.max(0,target-available);}
export function compound(principal:number,annualRate:number,years:number):number{if(![principal,annualRate,years].every(Number.isFinite)||principal<0||annualRate<=-1||years<0)throw Error('Invalid compounding inputs');return principal*(1+annualRate)**years;}
export function debtCost(balance:number,annualRate:number):number{if(![balance,annualRate].every(Number.isFinite)||balance<0||annualRate<0)throw Error('Invalid debt inputs');return balance*annualRate;}
export function surplusScenario(income:number,spending:number,repayments:number,reduction:number){if(![income,spending,repayments,reduction].every(Number.isFinite)||[income,spending,repayments,reduction].some(v=>v<0)||reduction>spending)throw Error('Invalid scenario inputs');return income-spending-repayments+reduction;}
